package com.roma.qurie.quiz.dto;

import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;

public record QuizProgressResponse(
		Long id,
		Long quizId,
		QuizProgressStatus status,
		Integer chosenChoiceIdx,
		Boolean isCorrect,
		long elapsedMs) {

	public static QuizProgressResponse from(QuizProgress progress) {
		return new QuizProgressResponse(
				progress.getId(),
				progress.getQuiz().getId(),
				progress.getStatus(),
				progress.getChosenChoice() != null ? progress.getChosenChoice().getIdx() : null,
				progress.getIsCorrect(),
				progress.getElapsedMs());
	}
}
