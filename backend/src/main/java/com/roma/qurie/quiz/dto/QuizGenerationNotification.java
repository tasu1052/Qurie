package com.roma.qurie.quiz.dto;

import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;

/** 퀴즈 생성 완료/실패를 세션 웹소켓 토픽으로 알릴 때 담는 payload. */
public record QuizGenerationNotification(Long quizSetId, QuizSetStatus status, int generatedCount,
		String errorMessage) {

	public static QuizGenerationNotification from(QuizSet quizSet) {
		return new QuizGenerationNotification(
				quizSet.getId(), quizSet.getStatus(), quizSet.getGeneratedCount(), quizSet.getErrorMessage());
	}
}
