package com.roma.qurie.quiz.dto;

import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;

public record QuizProgressResponse(
		Long id,
		Long quizId,
		QuizProgressStatus status,
		Integer chosenChoiceIdx,
		Boolean isCorrect,
		long elapsedMs,
		String explanation,
		Integer correctChoiceIdx) {

	public static QuizProgressResponse from(QuizProgress progress) {
		Quiz quiz = progress.getQuiz();
		Integer correctIdx = null;
		if (quiz != null && quiz.getChoices() != null) {
			correctIdx = quiz.getChoices().stream()
					.filter(QuizChoice::isAnswer)
					.map(QuizChoice::getIdx)
					.findFirst()
					.orElse(null);
		}
		return new QuizProgressResponse(
				progress.getId(),
				quiz != null ? quiz.getId() : null,
				progress.getStatus(),
				progress.getChosenChoice() != null ? progress.getChosenChoice().getIdx() : null,
				progress.getIsCorrect(),
				progress.getElapsedMs(),
				quiz != null ? quiz.getExplanation() : null,
				correctIdx);
	}
}
