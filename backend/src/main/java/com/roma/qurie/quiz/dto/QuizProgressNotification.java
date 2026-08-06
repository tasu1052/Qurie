package com.roma.qurie.quiz.dto;

/**
 * 학생이 문항을 제출할 때마다 세션 웹소켓으로 알리는 응시 집계.
 * 강사 현황판이 폴링 없이 진행률을 갱신하기 위한 payload 이다.
 */
public record QuizProgressNotification(
		Long quizSetId,
		int totalQuizCount,
		int startedStudentCount,
		int inProgressStudentCount,
		int completedStudentCount,
		int totalStudentCount,
		boolean allCompleted) {
}
