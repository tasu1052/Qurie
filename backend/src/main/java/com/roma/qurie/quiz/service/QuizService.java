package com.roma.qurie.quiz.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.ai.AiQuizCreateRequest;
import com.roma.qurie.quiz.ai.AiQuizSetAccepted;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse;
import com.roma.qurie.quiz.ai.QuizAiClient;
import com.roma.qurie.quiz.ai.QuizAiException;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.dto.QuizGenerationNotification;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizPurpose;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;
import com.roma.qurie.quiz.repository.QuizSetRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

	/** todo: 문항 제한 시간 정책이 정해지면 요청/난이도별 값으로 교체. */
	private static final int DEFAULT_TIME_LIMIT_SEC = 60;

	private final QuizSetRepository quizSetRepository;
	private final ProjectRepository projectRepository;
	private final QuizAiClient quizAiClient;
	private final SimpMessagingTemplate messagingTemplate;

	/** AI 서버가 생성 완료를 알려올 콜백 주소의 베이스 — 배포 시 백엔드 자신의 외부 접근 주소로 바뀐다. */
	@Value("${app.ai.callback-base-url}")
	private String callbackBaseUrl;

	/**
	 * 퀴즈 생성 요청. 접수 기록(QuizSet)을 먼저 남기고 AI 서버에 생성을 넘긴다 —
	 * AI 가 죽어 있어도 요청 이력이 FAILED 로 남아 사용자가 재시도 여부를 판단할 수 있다.
	 *
	 * 일부러 @Transactional 을 걸지 않는다. AI 호출(최대 수 초)이 트랜잭션 안에 들어가면
	 * 그 시간만큼 DB 커넥션을 점유하므로, 저장은 repository 의 자체 트랜잭션 두 번으로 나눈다.
	 */
	public QuizGenerateResponse requestQuizGeneration(Long projectId, QuizGenerateRequest request, Long createdBy) {
		QuizSet quizSet = quizSetRepository.save(QuizSet.builder()
				.projectId(projectId)
				.versionHash(request.versionHash())
				.mode(request.mode())
				.requestedCount(request.count())
				.ratioEasy(request.ratioEasy())
				.ratioNormal(request.ratioNormal())
				.ratioHard(request.ratioHard())
				.userPrompt(request.userPrompt())
				.createdBy(createdBy)
				.build());

		try {
			String callbackUrl = callbackBaseUrl + "/api/quiz/" + quizSet.getId() + "/callback";
			AiQuizSetAccepted accepted =
					quizAiClient.createQuizSet(projectId, AiQuizCreateRequest.from(request, callbackUrl));
			quizSet.markGenerating(accepted.quizSetId());
		} catch (QuizAiException e) {
			quizSet.fail(e.getMessage());
		}

		return QuizGenerateResponse.from(quizSetRepository.save(quizSet));
	}

	/**
	 * 퀴즈셋 조회. 생성 중이면 AI 서버 상태를 함께 확인해서 완료(READY)면 문항을 저장하고
	 * COMPLETED 로 넘긴다 — 콜백이 오지 않았을 때(네트워크 문제 등)를 대비한 안전망이다.
	 */
	@Transactional
	public QuizSetDetailResponse getQuizSet(Long quizSetId) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);

		syncFromAi(quizSet);

		return QuizSetDetailResponse.from(quizSet);
	}

	/**
	 * AI 서버가 생성을 마치고 보내는 콜백. 정상 경로에서는 이 호출이 문항 저장과 세션 알림을 담당하고,
	 * getQuizSet 의 폴링 동기화는 콜백이 유실됐을 때만 뒤늦게 같은 일을 한다.
	 *
	 * 콜백은 중복 전송될 수 있으므로(재시도 등) 이미 처리된 세트는 조용히 무시한다.
	 */
	@Transactional
	public void handleCallback(Long quizSetId, AiQuizStatusResponse payload) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		if (quizSet.getStatus() != QuizSetStatus.GENERATING) {
			return;
		}
		if (quizSet.getAiQuizSetId() != null && !quizSet.getAiQuizSetId().equals(payload.quizSetId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "콜백의 quiz_set_id 가 일치하지 않습니다.");
		}

		applyAiResult(quizSet, payload);
	}

	private void syncFromAi(QuizSet quizSet) {
		if (quizSet.getStatus() != QuizSetStatus.GENERATING || quizSet.getAiQuizSetId() == null) {
			return;
		}

		AiQuizStatusResponse aiResponse;
		try {
			aiResponse = quizAiClient.getStatus(quizSet.getAiQuizSetId());
		} catch (QuizAiException e) {
			// AI 가 잠깐 안 붙는 것은 조회 실패가 아니다. 지금 상태를 그대로 돌려주고 다음 폴링에 맡긴다.
			return;
		}

		applyAiResult(quizSet, aiResponse);
	}

	private void applyAiResult(QuizSet quizSet, AiQuizStatusResponse aiResponse) {
		switch (aiResponse.status()) {
			case READY -> applyGeneratedQuizzes(quizSet, aiResponse.quizzes());
			case FAILED -> quizSet.fail(
					aiResponse.errorMessage() != null ? aiResponse.errorMessage() : "AI 퀴즈 생성에 실패했습니다.");
			case PENDING, GENERATING -> {
				return;
			}
		}

		notifySession(quizSet);
	}

	/** 세트가 끝났음을 세션에 연결된 구성원들에게 웹소켓으로 알린다. */
	private void notifySession(QuizSet quizSet) {
		projectRepository.findById(quizSet.getProjectId()).ifPresentOrElse(
				project -> messagingTemplate.convertAndSend(
						"/topic/sessions/" + project.getSessionId() + "/quiz",
						QuizGenerationNotification.from(quizSet)),
				() -> log.warn("퀴즈 완료를 알릴 프로젝트를 찾지 못했습니다. projectId={}", quizSet.getProjectId()));
	}

	private QuizSet findQuizSetOrThrow(Long quizSetId) {
		return quizSetRepository.findById(quizSetId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋을 찾을 수 없습니다: " + quizSetId));
	}

	/** AI 는 현재 4지선다만 생성하므로 type 은 MULTIPLE_CHOICE 로 고정한다. */
	private void applyGeneratedQuizzes(QuizSet quizSet, List<AiQuizStatusResponse.AiQuiz> aiQuizzes) {
		List<AiQuizStatusResponse.AiQuiz> generated = aiQuizzes == null ? List.of() : aiQuizzes;

		int orderNo = 1;
		for (AiQuizStatusResponse.AiQuiz aiQuiz : generated) {
			List<String> choices = aiQuiz.choices() == null ? List.of() : aiQuiz.choices();
			boolean answerInRange = aiQuiz.answerIndex() >= 0 && aiQuiz.answerIndex() < choices.size();

			Quiz quiz = Quiz.builder()
					.type(QuizType.MULTIPLE_CHOICE)
					.purpose(QuizPurpose.valueOf(aiQuiz.purpose()))
					.difficulty(QuizDifficulty.valueOf(aiQuiz.difficulty()))
					.testedConcept(aiQuiz.testedConcept())
					.question(aiQuiz.question())
					.answerText(answerInRange ? choices.get(aiQuiz.answerIndex()) : null)
					.explanation(aiQuiz.explanation())
					.filePath(aiQuiz.filePath())
					.lineStart(aiQuiz.lineStart())
					.lineEnd(aiQuiz.lineEnd())
					.timeLimitSec(DEFAULT_TIME_LIMIT_SEC)
					.orderNo(orderNo++)
					.build();
			for (int idx = 0; idx < choices.size(); idx++) {
				quiz.addChoice(QuizChoice.of(idx, choices.get(idx), idx == aiQuiz.answerIndex()));
			}
			quizSet.addQuiz(quiz);
		}

		quizSet.complete(generated.size());
	}
}
