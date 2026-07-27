package com.roma.qurie.quiz.dto;

import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;

public record QuizGenerateResponse(Long quizSetId, QuizSetStatus status, int requestedCount) {

	public static QuizGenerateResponse from(QuizSet quizSet) {
		return new QuizGenerateResponse(quizSet.getId(), quizSet.getStatus(), quizSet.getRequestedCount());
	}
}
