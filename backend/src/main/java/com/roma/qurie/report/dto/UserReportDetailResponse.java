package com.roma.qurie.report.dto;

import com.roma.qurie.report.entity.UserReport;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public record UserReportDetailResponse(
        Long userReportId,
        Long ordinaryUserId,
        String userName,
        Long classId,
        int sessionCount,
        int quizTotalCount,
        int quizAttemptedCount,
        int quizCorrectCount,
        int quizSkippedCount,
        BigDecimal completionRate,
        BigDecimal accuracy,
        Integer avgElapsedMs,
        Map<String, Object> difficultyRatio,
        Map<String, Object> conceptStats,
        BigDecimal rating,
        String ratingFormulaVersion,
        LocalDateTime issuedAt) {

    public static UserReportDetailResponse from(UserReport report, String userName) {
        return new UserReportDetailResponse(
                report.getId(),
                report.getOrdinaryUserId(),
                userName,
                report.getClassId(),
                report.getSessionCount(),
                report.getQuizTotalCount(),
                report.getQuizAttemptedCount(),
                report.getQuizCorrectCount(),
                report.getQuizSkippedCount(),
                report.getCompletionRate(),
                report.getAccuracy(),
                report.getAvgElapsedMs(),
                report.getDifficultyRatio(),
                report.getConceptStats(),
                report.getRating(),
                report.getRatingFormulaVersion(),
                report.getIssuedAt());
    }
}
