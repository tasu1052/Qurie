package com.roma.qurie.quiz.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.quiz.ai.AiQuizCreateRequest;
import com.roma.qurie.quiz.ai.AiQuizSetAccepted;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse;
import com.roma.qurie.quiz.ai.QuizAiClient;
import com.roma.qurie.quiz.ai.QuizAiException;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
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

@Service
@RequiredArgsConstructor
public class QuizService {

	/** todo: 문항 제한 시간 정책이 정해지면 요청/난이도별 값으로 교체. */
	private static final int DEFAULT_TIME_LIMIT_SEC = 60;

	private final QuizSetRepository quizSetRepository;
	private final QuizAiClient quizAiClient;

	/**
	 * 퀴즈 생성 요청. 접수 기록(QuizSet)을 먼저 남기고 AI 서버에 생성을 넘긴다 —
	 * AI 가 죽어 있어도 요청 이력이 FAILED 로 남아 사용자가 재시도 여부를 판단할 수 있다.
	 *
	 * 일부러 @Transactional 을 걸지 않는다. AI 호출(최대 수 초)이 트랜잭션 안에 들어가면
	 * 그 시간만큼 DB 커넥션을 점유하므로, 저장은 repository 의 자체 트랜잭션 두 번으로 나눈다.
	 */
	public QuizGenerateResponse requestQuizGeneration(Long projectId, QuizGenerateRequest request) {
		QuizSet quizSet = quizSetRepository.save(QuizSet.builder()
				.projectId(projectId)
				.snapshotId(request.snapshotId())
				.mode(request.mode())
				.requestedCount(request.count())
				.requestedTypes(request.types())
				.ratioEasy(request.ratioEasy())
				.ratioNormal(request.ratioNormal())
				.ratioHard(request.ratioHard())
				.userPrompt(request.userPrompt())
				.createdBy(request.createdBy())
				.build());

		try {
			AiQuizSetAccepted accepted = quizAiClient.createQuizSet(projectId, AiQuizCreateRequest.from(request));
			quizSet.markGenerating(accepted.quizSetId());
		} catch (QuizAiException e) {
			quizSet.fail(e.getMessage());
		}

		return QuizGenerateResponse.from(quizSetRepository.save(quizSet));
	}

	/**
	 * 퀴즈셋 조회. 생성 중이면 AI 서버 상태를 함께 확인해서 완료(READY)면 문항을 저장하고
	 * COMPLETED 로 넘긴다 — 스케줄러 없이 프론트 폴링이 동기화를 이끄는 구조다.
	 */
	@Transactional
	public QuizSetDetailResponse getQuizSet(Long quizSetId) {
		QuizSet quizSet = quizSetRepository.findById(quizSetId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋을 찾을 수 없습니다: " + quizSetId));

		syncFromAi(quizSet);

		return QuizSetDetailResponse.from(quizSet);
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

		switch (aiResponse.status()) {
			case READY -> applyGeneratedQuizzes(quizSet, aiResponse.quizzes());
			case FAILED -> quizSet.fail(
					aiResponse.errorMessage() != null ? aiResponse.errorMessage() : "AI 퀴즈 생성에 실패했습니다.");
			case PENDING, GENERATING -> {
			}
		}
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
