package com.roma.qurie.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import java.util.ArrayList;
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
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
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
import com.roma.qurie.quiz.dto.QuizQuestionsResponse;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizGenerationMode;
import com.roma.qurie.quiz.entity.QuizPurpose;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizSatisfactionRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

	private static final Long PROJECT_ID = 1L;
	private static final Long SESSION_ID = 100L;
	private static final Long QUIZ_SET_ID = 10L;
	private static final Long AI_QUIZ_SET_ID = 77L;
	private static final Long CREATED_BY = 2L;
	private static final String CALLBACK_BASE_URL = "http://backend.internal";
	private static final AuthUser MANAGER =
			new AuthUser(CREATED_BY, "MANAGER", 100L, "manager@qurie.com", "매니저", null);
	private static final AuthUser STUDENT =
			new AuthUser(7L, "STUDENT", 100L, "student@qurie.com", "학생", 5L);

	@Mock
	private QuizSetRepository quizSetRepository;

	@Mock
	private QuizProgressRepository quizProgressRepository;

	@Mock
	private QuizSatisfactionRepository quizSatisfactionRepository;

	@Mock
	private TransactionTemplate transactionTemplate;

	@Mock
	private ProjectRepository projectRepository;

	@Mock
	private QuizAiClient quizAiClient;

	@Mock
	private SimpMessagingTemplate messagingTemplate;

	@Mock
	private SessionParticipantService participantService;

	@InjectMocks
	private QuizService quizService;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(quizService, "callbackBaseUrl", CALLBACK_BASE_URL);
		org.mockito.Mockito.lenient()
				.when(quizSetRepository.existsByProjectIdAndSourcePathAndStatusIn(any(), any(), any()))
				.thenReturn(false);
		org.mockito.Mockito.lenient()
				.when(quizSetRepository.findByProjectIdOrderByIdDesc(any()))
				.thenReturn(List.of());
		org.mockito.Mockito.lenient()
				.when(transactionTemplate.execute(any()))
				.thenAnswer(invocation -> {
					TransactionCallback<?> callback = invocation.getArgument(0);
					return callback.doInTransaction(org.mockito.Mockito.mock(TransactionStatus.class));
				});
	}

	@Test
	void requestQuizGenerationSendsCodeFilesToAiAndMarksGenerating() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> {
			QuizSet saved = invocation.getArgument(0);
			ReflectionTestUtils.setField(saved, "id", QUIZ_SET_ID);
			return saved;
		});
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willReturn(new AiQuizSetAccepted(AI_QUIZ_SET_ID, "1", "PENDING"));

		QuizGenerateResponse response =
				quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER);

		ArgumentCaptor<AiQuizCreateRequest> captor = ArgumentCaptor.forClass(AiQuizCreateRequest.class);
		org.mockito.Mockito.verify(quizAiClient).createQuizSet(eq(PROJECT_ID), captor.capture());
		AiQuizCreateRequest aiRequest = captor.getValue();
		assertThat(aiRequest.mode()).isEqualTo(QuizGenerationMode.ASSESSMENT);
		assertThat(aiRequest.requestedCount()).isEqualTo(5);
		assertThat(aiRequest.versionHash()).isEqualTo("abc123");
		assertThat(aiRequest.files()).containsEntry("src/Main.java", "public class Main {}");
		assertThat(aiRequest.callbackUrl()).isEqualTo(CALLBACK_BASE_URL + "/api/quiz/" + QUIZ_SET_ID + "/callback");
		// 이전 퀴즈셋이 없으면 avoid_questions 는 빈 배열로 나간다 — null 이면 AI 접수(422)에서 깨진다.
		assertThat(aiRequest.avoidQuestions()).isEmpty();

		assertThat(response.quizSetId()).isEqualTo(QUIZ_SET_ID);
		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
	}

	@Test
	void requestQuizGenerationFailsTheSetWhenAiIsUnreachable() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> invocation.getArgument(0));
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willThrow(new QuizAiException("AI 퀴즈 생성 요청 실패: 연결 거부", null));

		QuizGenerateResponse response =
				quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.FAILED);
	}

	@Test
	void requestQuizGenerationWipesPreviousSetsAndProgress() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		List<QuizSet> previousSets = List.of(generatingQuizSet());
		given(quizSetRepository.findByProjectIdOrderByIdDesc(PROJECT_ID)).willReturn(previousSets);
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> invocation.getArgument(0));
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willReturn(new AiQuizSetAccepted(AI_QUIZ_SET_ID, "1", "PENDING"));

		quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER);

		// 응시 기록이 문항 FK 에 물려 있으므로 반드시 퀴즈셋 삭제보다 먼저 지워야 한다.
		org.mockito.InOrder inOrder = org.mockito.Mockito.inOrder(quizProgressRepository, quizSetRepository);
		inOrder.verify(quizProgressRepository).deleteAllByQuizSetIdIn(any());
		inOrder.verify(quizSetRepository).deleteAll(previousSets);
	}

	@Test
	void requestQuizGenerationPassesPreviousQuestionsToAiAsAvoidList() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		QuizSet previousSet = generatingQuizSet();
		previousSet.addQuiz(quiz("동시성 제어", "이 코드에서 락 획득 순서는?"));
		previousSet.addQuiz(quiz(null, "개념 없는 문항은 질문만 실린다"));
		given(quizSetRepository.findByProjectIdOrderByIdDesc(PROJECT_ID)).willReturn(List.of(previousSet));
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> invocation.getArgument(0));
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willReturn(new AiQuizSetAccepted(AI_QUIZ_SET_ID, "1", "PENDING"));

		quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER);

		ArgumentCaptor<AiQuizCreateRequest> captor = ArgumentCaptor.forClass(AiQuizCreateRequest.class);
		org.mockito.Mockito.verify(quizAiClient).createQuizSet(eq(PROJECT_ID), captor.capture());
		assertThat(captor.getValue().avoidQuestions()).containsExactly(
				"[동시성 제어] 이 코드에서 락 획득 순서는?",
				"개념 없는 문항은 질문만 실린다");
	}

	@Test
	void requestQuizGenerationTruncatesAndCapsAvoidQuestions() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		QuizSet previousSet = generatingQuizSet();
		for (int i = 0; i < 45; i++) {
			previousSet.addQuiz(quiz("개념" + i, "질문 ".repeat(100) + i));
		}
		given(quizSetRepository.findByProjectIdOrderByIdDesc(PROJECT_ID)).willReturn(List.of(previousSet));
		given(quizSetRepository.save(any(QuizSet.class))).willAnswer(invocation -> invocation.getArgument(0));
		given(quizAiClient.createQuizSet(eq(PROJECT_ID), any(AiQuizCreateRequest.class)))
				.willReturn(new AiQuizSetAccepted(AI_QUIZ_SET_ID, "1", "PENDING"));

		quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER);

		ArgumentCaptor<AiQuizCreateRequest> captor = ArgumentCaptor.forClass(AiQuizCreateRequest.class);
		org.mockito.Mockito.verify(quizAiClient).createQuizSet(eq(PROJECT_ID), captor.capture());
		List<String> avoidQuestions = captor.getValue().avoidQuestions();
		assertThat(avoidQuestions).hasSize(40);
		assertThat(avoidQuestions).allSatisfy(entry -> assertThat(entry.length()).isLessThanOrEqualTo(200));
		assertThat(avoidQuestions.get(0)).startsWith("[개념0] 질문");
	}

	@Test
	void requestQuizGenerationRejectsWhenProjectAlreadyGenerating() {
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizSetRepository.existsByProjectIdAndSourcePathAndStatusIn(
				eq(PROJECT_ID),
				eq("src/Main.java"),
				eq(List.of(QuizSetStatus.QUEUED, QuizSetStatus.GENERATING))))
				.willReturn(true);

		assertThatThrownBy(() -> quizService.requestQuizGeneration(PROJECT_ID, generateRequest(), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);

		org.mockito.Mockito.verify(quizAiClient, org.mockito.Mockito.never())
				.createQuizSet(any(), any());
	}

	@Test
	void getQuizSetPersistsQuizzesAndCompletesWhenAiIsReady() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(readyAiResponse());
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

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
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.FAILED, List.of(), "LLM 호출 한도 초과", null));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.FAILED);
		assertThat(response.errorMessage()).isEqualTo("LLM 호출 한도 초과");
	}

	@Test
	void getQuizSetKeepsGeneratingWhenAiIsStillWorking() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, List.of(), null, null));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
		assertThat(response.quizzes()).isEmpty();
	}

	@Test
	void getQuizSetMergesPartialQuizzesWhileGenerating() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, List.of(readyAiResponse().quizzes().get(0)),
				null, List.of(new AiQuizStatusResponse.AiLlmCall("JUDGE"))));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
		assertThat(response.quizzes()).hasSize(1);
		assertThat(response.generatedCount()).isEqualTo(1);
		assertThat(response.generationStage()).isEqualTo("JUDGE");
		org.mockito.Mockito.verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz"), any(Object.class));
	}

	@Test
	void getQuizSetKeepsCurrentStateWhenAiIsUnreachable() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID))
				.willThrow(new QuizAiException("AI 퀴즈 상태 조회 실패: 연결 거부", null));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
	}

	@Test
	void getQuizSetThrowsNotFoundWhenQuizSetDoesNotExist() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> quizService.getQuizSet(QUIZ_SET_ID, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void getQuizSetRejectsStudentBecauseAnswersAreIncluded() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(generatingQuizSet()));

		assertThatThrownBy(() -> quizService.getQuizSet(QUIZ_SET_ID, STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void getQuizSetExposesLatestGenerationStageWhileGenerating() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, List.of(), null,
				List.of(new AiQuizStatusResponse.AiLlmCall("GENERATE"),
						new AiQuizStatusResponse.AiLlmCall("SOLVE"))));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
		assertThat(response.generationStage()).isEqualTo("SOLVE");
	}

	@Test
	void getQuizQuestionsReturnsQuestionsWithoutAnswers() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(readyAiResponse());
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));

		QuizQuestionsResponse response = quizService.getQuizQuestions(QUIZ_SET_ID, STUDENT);

		org.mockito.Mockito.verify(participantService).verifySessionClassMember(SESSION_ID, STUDENT);
		assertThat(response.status()).isEqualTo(QuizSetStatus.COMPLETED);
		QuizQuestionsResponse.QuestionItem question = response.quizzes().get(0);
		assertThat(question.question()).isEqualTo("이 코드에서 락 획득 순서는?");
		assertThat(question.choices()).hasSize(4);
		assertThat(question.choices().get(0).content()).isEqualTo("A");
		// ChoiceItem/QuestionItem 에는 answer·explanation 필드 자체가 없다 — 컴파일 수준에서 보장된다.
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
				"1", AI_QUIZ_SET_ID + 1, AiQuizSetState.READY, List.of(), null, null);

		assertThatThrownBy(() -> quizService.handleCallback(QUIZ_SET_ID, mismatched))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);
	}

	@Test
	void getQuizSetDoesNotStorePartialBeyondRequestedCount() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID)).willReturn(new AiQuizStatusResponse(
				"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, eightAiQuizzes(),
				null, List.of(new AiQuizStatusResponse.AiLlmCall("JUDGE"))));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.GENERATING);
		assertThat(response.quizzes()).hasSize(5);
		assertThat(response.generatedCount()).isEqualTo(5);
		assertThat(quizSet.getQuizzes()).hasSize(5);
	}

	@Test
	void getQuizSetTrimsPartialQuizzesDownToReadyCount() {
		QuizSet quizSet = generatingQuizSet();
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizAiClient.getStatus(AI_QUIZ_SET_ID))
				.willReturn(new AiQuizStatusResponse(
						"1", AI_QUIZ_SET_ID, AiQuizSetState.GENERATING, eightAiQuizzes().subList(0, 5),
						null, null))
				.willReturn(readyAiResponse());

		quizService.getQuizSet(QUIZ_SET_ID, MANAGER);
		assertThat(quizSet.getQuizzes()).hasSize(5);

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.status()).isEqualTo(QuizSetStatus.COMPLETED);
		assertThat(response.quizzes()).hasSize(1);
		assertThat(response.generatedCount()).isEqualTo(1);
		assertThat(quizSet.getQuizzes()).hasSize(1);
		assertThat(quizSet.getQuizzes().get(0).getQuestion()).isEqualTo("문항 1");
	}

	@Test
	void getQuizSetTrimsSurplusLeftOnCompletedSet() {
		QuizSet quizSet = generatingQuizSet();
		quizSet.complete(1);
		appendLocalQuiz(quizSet, 1, "남는 문항 1");
		appendLocalQuiz(quizSet, 2, "여분 문항 2");
		appendLocalQuiz(quizSet, 3, "여분 문항 3");
		ReflectionTestUtils.setField(quizSet.getQuizzes().get(0), "id", 101L);
		ReflectionTestUtils.setField(quizSet.getQuizzes().get(1), "id", 102L);
		ReflectionTestUtils.setField(quizSet.getQuizzes().get(2), "id", 103L);
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));

		QuizSetDetailResponse response = quizService.getQuizSet(QUIZ_SET_ID, MANAGER);

		assertThat(response.quizzes()).hasSize(1);
		assertThat(quizSet.getQuizzes()).hasSize(1);
		org.mockito.Mockito.verify(quizProgressRepository).deleteAllByQuizIdIn(List.of(102L, 103L));
	}

	private void appendLocalQuiz(QuizSet quizSet, int orderNo, String question) {
		quizSet.addQuiz(Quiz.builder()
				.type(QuizType.MULTIPLE_CHOICE)
				.purpose(QuizPurpose.MICRO)
				.difficulty(QuizDifficulty.NORMAL)
				.testedConcept("개념")
				.question(question)
				.timeLimitSec(60)
				.orderNo(orderNo)
				.build());
	}

	private List<AiQuiz> eightAiQuizzes() {
		List<AiQuiz> quizzes = new ArrayList<>();
		for (int i = 1; i <= 8; i++) {
			quizzes.add(new AiQuiz(
					"MICRO", "NORMAL", "개념" + i, "문항 " + i,
					List.of("A", "B", "C", "D"), 0, "설명", "src/Main.java", 1, 2));
		}
		return quizzes;
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
				Map.of("src/Main.java", "public class Main {}"),
				"src/Main.java",
				"file");
	}

	private Quiz quiz(String testedConcept, String question) {
		return Quiz.builder()
				.type(QuizType.MULTIPLE_CHOICE)
				.purpose(QuizPurpose.CONCEPTUAL)
				.difficulty(QuizDifficulty.NORMAL)
				.testedConcept(testedConcept)
				.question(question)
				.timeLimitSec(60)
				.orderNo(1)
				.build();
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
				null, null);
	}

	private Project project() {
		return new Project(SESSION_ID, null, CREATED_BY);
	}
}
