package com.roma.qurie.quiz.dto;

import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;

/** 프로젝트별 퀴즈셋 목록/복원용. 문항 본문 없이 상태만 담는다. */
public record QuizSetSummaryResponse(
		Long quizSetId,
		QuizSetStatus status,
		int requestedCount,
		int generatedCount,
		String errorMessage,
		Integer satisfactionRating) {

	public static QuizSetSummaryResponse from(QuizSet quizSet) {
		return new QuizSetSummaryResponse(
				quizSet.getId(),
				quizSet.getStatus(),
				quizSet.getRequestedCount(),
				quizSet.getGeneratedCount(),
				quizSet.getErrorMessage(),
				quizSet.getSatisfactionRating());
	}
}
