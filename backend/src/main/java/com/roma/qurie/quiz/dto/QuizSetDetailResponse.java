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
 * 정답(answer)이 포함되므로 출제자(매니저) 화면 전용이다 — 학생 응시 화면이 생기면
 * 정답을 뺀 별도 응답으로 분리해야 한다.
 */
public record QuizSetDetailResponse(
		Long quizSetId,
		QuizSetStatus status,
		int requestedCount,
		int generatedCount,
		String errorMessage,
		List<QuizItem> quizzes) {

	public static QuizSetDetailResponse from(QuizSet quizSet) {
		return new QuizSetDetailResponse(
				quizSet.getId(),
				quizSet.getStatus(),
				quizSet.getRequestedCount(),
				quizSet.getGeneratedCount(),
				quizSet.getErrorMessage(),
				quizSet.getQuizzes().stream().map(QuizItem::from).toList());
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
