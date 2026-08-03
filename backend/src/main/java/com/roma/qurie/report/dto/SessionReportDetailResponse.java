package com.roma.qurie.report.dto;

import com.roma.qurie.report.entity.SessionReport;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** 세션 리포트 상세. 종합 리포트 목록에서 클릭해 조회하는 화면용. */
public record SessionReportDetailResponse(
        Long sessionReportId,
        Long sessionId,
        String sessionTitle,
        Long ordinaryUserId,
        String userName,
        Long quizSetId,
        int quizTotalCount,
        int quizAttemptedCount,
        int quizCorrectCount,
        int quizSkippedCount,
        BigDecimal completionRate,
        BigDecimal accuracy,
        Integer avgElapsedMs,
        Map<String, Object> difficultyRatio,
        Map<String, Object> conceptStats,
        BigDecimal quizRating,
        String aiComment,
        List<String> aiStrengths,
        List<String> aiImprovements,
        String managerComment,
        LocalDateTime issuedAt) {

    public static SessionReportDetailResponse from(
            SessionReport report, String sessionTitle, String userName) {
        return new SessionReportDetailResponse(
                report.getId(),
                report.getSessionId(),
                sessionTitle,
                report.getOrdinaryUserId(),
                userName,
                report.getQuizSetId(),
                report.getQuizTotalCount(),
                report.getQuizAttemptedCount(),
                report.getQuizCorrectCount(),
                report.getQuizSkippedCount(),
                report.getCompletionRate(),
                report.getAccuracy(),
                report.getAvgElapsedMs(),
                report.getDifficultyRatio(),
                report.getConceptStats(),
                report.getQuizRating(),
                report.getAiComment(),
                report.getAiStrengths(),
                report.getAiImprovements(),
                report.getManagerComment(),
                report.getIssuedAt());
    }
}
