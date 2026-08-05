package com.roma.qurie.quiz.dto;

/** 학생이 퀴즈셋을 완주했을 때 세션 웹소켓 토픽으로 알리는 완주 현황 payload. */
public record QuizProgressNotification(Long quizSetId, int completedStudentCount, int totalStudentCount,
		boolean allCompleted) {
}
