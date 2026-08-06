package com.roma.qurie.quiz.dto;

import java.util.List;

/** 퀴즈셋 기준 학생 응시 현황(강사·마스터 전용). */
public record QuizProgressRosterResponse(
		Long quizSetId,
		int totalQuizCount,
		int totalStudentCount,
		int startedStudentCount,
		int inProgressStudentCount,
		int completedStudentCount,
		boolean allCompleted,
		List<QuizProgressRosterItemResponse> students) {
}
