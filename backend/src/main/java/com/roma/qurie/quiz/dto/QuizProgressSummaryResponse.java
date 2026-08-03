package com.roma.qurie.quiz.dto;

import java.util.List;

import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizSet;

/** 학생 본인의 응시 현황. 응시 후 결과 화면에 쓴다. */
public record QuizProgressSummaryResponse(
		Long quizSetId,
		int totalCount,
		int attemptedCount,
		int correctCount,
		List<ProgressItem> items) {

	public static QuizProgressSummaryResponse from(QuizSet quizSet, List<QuizProgress> progresses) {
		int attemptedCount = (int) progresses.stream()
				.filter(progress -> progress.getStatus() == QuizProgressStatus.ATTEMPTED)
				.count();
		int correctCount = (int) progresses.stream()
				.filter(progress -> Boolean.TRUE.equals(progress.getIsCorrect()))
				.count();

		return new QuizProgressSummaryResponse(
				quizSet.getId(),
				quizSet.getQuizzes().size(),
				attemptedCount,
				correctCount,
				progresses.stream().map(ProgressItem::from).toList());
	}

	public record ProgressItem(
			Long quizId, QuizProgressStatus status, Integer chosenChoiceIdx, Boolean isCorrect, long elapsedMs) {

		public static ProgressItem from(QuizProgress progress) {
			return new ProgressItem(
					progress.getQuiz().getId(),
					progress.getStatus(),
					progress.getChosenChoice() != null ? progress.getChosenChoice().getIdx() : null,
					progress.getIsCorrect(),
					progress.getElapsedMs());
		}
	}
}
