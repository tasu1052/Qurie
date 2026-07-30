package com.roma.qurie.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.ai.AiQuizCreateRequest;
import com.roma.qurie.quiz.ai.AiQuizSetAccepted;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse.AiQuiz;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse.AiQuizSetState;
import com.roma.qurie.quiz.ai.QuizAiClient;
import com.roma.qurie.quiz.ai.QuizAiException;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizGenerationMode;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;
import com.roma.qurie.quiz.repository.QuizSetRepository;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

	private static final Long PROJECT_ID = 1L;
	private static final Long SESSION_ID = 100L;
	private static final Long QUIZ_SET_ID = 10L;
	private static final Long AI_QUIZ_SET_ID = 77L;
	private static final Long CREATED_BY = 2L;
	private static final String CALLBACK_BASE_URL = "http://backend.internal";

	@Mock
	private QuizSetRepository quizSetRepository;

	@Mock
	private ProjectRepository projectRepository;

	@Mock
	private QuizAiClient quizAiClient;

	@Mock
	private SimpMessagingTemplate messagingTemplate;

	@InjectMocks
	private QuizService quizService;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(quizService, "callbackBaseUrl", CALLBACK_BASE_URL);
	}

	@Test
	void requestQuizGenerationSendsCodeFilesToAiAndMarksGenerating() {
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> {
			QuizSet saved = invocation.getArgument(0);
			ReflectionTestUtils.setField(saved, "id", QUIZ_SET_ID);
			return saved;
		});
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willReturn(new AiQuizSetAccepted(AI_QUIZ_SET_ID, "1", "PENDING"));

		QuizGenerateResponse response =
				quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), CREATED_BY);

		ArgumentCaptor<AiQuizCreateRequest> captor = ArgumentCaptor.forClass(AiQuizCreateRequest.class);
		org.mockito.Mockito.verify(quizAiClient).createQuizSet(eq(PROJECT_ID), captor.capture());
		AiQuizCreateRequest aiRequest = captor.getValue();
		assertThat(aiRequest.mode()).isEqualTo(QuizGenerationMode.ASSESSMENT);
		assertThat(aiRequest.requestedCount()).isEqualTo(5);
		assertThat(aiRequest.versionHash()).isEqualTo("abc123");
		assertThat(aiRequest.files()).containsEntry("src/Main.java", "public class Main {}");
		assertThat(aiRequest.callbackUrl()).isEqualTo(CALLBACK_BASE_URL + "/api/quiz/" + QUIZ_SET_ID + "/callback");

		assertThat(response.quizSetId()).isEqualTo(QUIZ_SET_ID);
		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
	}

	@Test
	void requestQuizGenerationFailsTheSetWhenAiIsUnreachable() {
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> invocation.getArgument(0));
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willThrow(new QuizAiException("AI 퀴즈 생성 요청 실패: 연결 거부", null));

		QuizGenerateResponse response =
				quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), CREATED_BY);

		assertThat(response.status()).isEqualTo(QuizSetStatus.FAILED);
	}

	@Test
	void getQuizSetPersistsQuizzesAndCompletesWhenAiIsReady() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(readyAiResponse());
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID);

		assertThat(response.status()).isEqualTo(QuizSetStatus.COMPLETED);
		assertThat(response.generatedCount()).isEqualTo(1);
		QuizSetDetailResponse.QuizItem quiz = response.quizzes().get(0);
		assertThat(quiz.type()).isEqualTo(QuizType.MULTIPLE_CHOICE);
		assertThat(quiz.difficulty()).isEqualTo(QuizDifficulty.NORMAL);
		assertThat(quiz.orderNo()).isEqualTo(1);
		assertThat(quiz.choices()).hasSize(4);
		assertThat(quiz.choices().get(2).answer()).isTrue();
		assertThat(quiz.choices().get(0).answer()).isFalse();
		assertThat(quizSet.getQuizzes().get(0).getAnswerText()).isEqualTo("C");
		org.mockito.Mockito.verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz"), any(Object.class));
	}

	@Test
	void getQuizSetFailsTheSetWhenAiReportsFailure() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.FAILED, List.of(), "LLM 호출 한도 초과"));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID);

		assertThat(response.status()).isEqualTo(QuizSetStatus.FAILED);
		assertThat(response.errorMessage()).isEqualTo("LLM 호출 한도 초과");
	}

	@Test
	void getQuizSetKeepsGeneratingWhenAiIsStillWorking() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, List.of(), null));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
		assertThat(response.quizzes()).isEmpty();
	}

	@Test
	void getQuizSetKeepsCurrentStateWhenAiIsUnreachable() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID))
				.willThrow(new QuizAiException("AI 퀴즈 상태 조회 실패: 연결 거부", null));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
	}

	@Test
	void getQuizSetThrowsNotFoundWhenQuizSetDoesNotExist() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> quizService.getQuizSet(QUIZ_SET_ID))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void handleCallbackPersistsQuizzesAndNotifiesSession() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));

		quizService.handleCallback(QUIZ_SET_ID, readyAiResponse());

		assertThat(quizSet.getStatus()).isEqualTo(QuizSetStatus.COMPLETED);
		assertThat(quizSet.getGeneratedCount()).isEqualTo(1);
		org.mockito.Mockito.verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz"), any(Object.class));
	}

	@Test
	void handleCallbackIgnoresDuplicateCallbackForAlreadyCompletedSet() {
		QuizSet quizSet = generatingQuizSet();
		quizSet.complete(1);
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));

		quizService.handleCallback(QUIZ_SET_ID, readyAiResponse());

		assertThat(quizSet.getGeneratedCount()).isEqualTo(1);
		org.mockito.Mockito.verify(messagingTemplate, org.mockito.Mockito.never())
				.convertAndSend(any(String.class), any(Object.class));
	}

	@Test
	void handleCallbackRejectsPayloadFromAnotherAiQuizSet() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));

		AiQuizStatusResponse mismatched = new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID + 1, AiQuizSetState.READY, List.of(), null);

		assertThatThrownBy(() -> quizService.handleCallback(QUIZ_SET_ID, mismatched))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException) throwable).getStatusCode();
	}

	private QuizGenerateRequest generateRequest() {
		return new QuizGenerateRequest(
				QuizGenerationMode.ASSESSMENT,
				5,
				30, 50, 20,
				null,
				"abc123",
				List.of(),
				Map.of("src/Main.java", "public class Main {}"));
	}

	private QuizSet generatingQuizSet() {
		QuizSet quizSet = QuizSet.builder()
				.projectId(PROJECT_ID)
				.versionHash("abc123")
				.mode(QuizGenerationMode.ASSESSMENT)
				.requestedCount(5)
				.ratioEasy(30)
				.ratioNormal(50)
				.ratioHard(20)
				.createdBy(CREATED_BY)
				.build();
		ReflectionTestUtils.setField(quizSet, "id", QUIZ_SET_ID);
		quizSet.markGenerating(AI_QUIZ_SET_ID);
		return quizSet;
	}

	private AiQuizStatusResponse readyAiResponse() {
		return new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.READY,
				List.of(new AiQuiz(
						"MICRO", "NORMAL", "동시성 제어", "이 코드에서 락 획득 순서는?",
						List.of("A", "B", "C", "D"), 2, "설명", "src/Main.java", 3, 9)),
				null);
	}

	private Project project() {
		return new Project(SESSION_ID, null, CREATED_BY);
	}
}
