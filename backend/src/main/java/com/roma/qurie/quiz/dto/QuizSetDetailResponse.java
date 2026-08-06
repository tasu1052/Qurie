package com.roma.qurie.quiz.dto;

import java.util.List;

import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizPurpose;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;

/**
 * 퀴즈셋 상태/결과 응답. 프론트는 COMPLETED 가 될 때까지 이 응답을 폴링한다.
 *
 * 정답(answer)이 포함되므로 출제자(강사) 전용이다 — 학생 응시 화면은 정답·해설을 뺀
 * QuizQuestionsResponse(GET /api/quiz/{id}/questions)를 쓴다.
 *
 * generationStage 는 GENERATING 인 동안의 현재 단계(GENERATE/SOLVE/JUDGE). 그 외 상태에서는 null.
 */
public record QuizSetDetailResponse(
		Long quizSetId,
		QuizSetStatus status,
		String generationStage,
		int requestedCount,
		int generatedCount,
		String errorMessage,
		List<QuizItem> quizzes) {

	public static QuizSetDetailResponse from(QuizSet quizSet, String generationStage) {
		return new QuizSetDetailResponse(
				quizSet.getId(),
				quizSet.getStatus(),
				generationStage,
				quizSet.getRequestedCount(),
				quizSet.getGeneratedCount(),
				quizSet.getErrorMessage(),
				quizSet.effectiveQuizzes().stream().map(QuizItem::from).toList());
	}

	public record QuizItem(
			Long id,
			QuizType type,
			QuizPurpose purpose,
			QuizDifficulty difficulty,
			String testedConcept,
			String question,
			String explanation,
			String filePath,
			Integer lineStart,
			Integer lineEnd,
			int timeLimitSec,
			int orderNo,
			List<ChoiceItem> choices) {

		public static QuizItem from(Quiz quiz) {
			return new QuizItem(
					quiz.getId(),
					quiz.getType(),
					quiz.getPurpose(),
					quiz.getDifficulty(),
					quiz.getTestedConcept(),
					quiz.getQuestion(),
					quiz.getExplanation(),
					quiz.getFilePath(),
					quiz.getLineStart(),
					quiz.getLineEnd(),
					quiz.getTimeLimitSec(),
					quiz.getOrderNo(),
					quiz.getChoices().stream().map(ChoiceItem::from).toList());
		}
	}

	public record ChoiceItem(int idx, String content, boolean answer) {

		public static ChoiceItem from(QuizChoice choice) {
			return new ChoiceItem(choice.getIdx(), choice.getContent(), choice.isAnswer());
		}
	}
}
