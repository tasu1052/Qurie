package com.roma.qurie.quiz.dto;

/** 강사 현황판의 학생 한 명 응시 상태. */
public record QuizProgressRosterItemResponse(
		Long userId,
		String userName,
		int answeredCount,
		int correctCount,
		int totalQuizCount,
		/** NOT_STARTED | IN_PROGRESS | COMPLETED */
		String status) {
}
