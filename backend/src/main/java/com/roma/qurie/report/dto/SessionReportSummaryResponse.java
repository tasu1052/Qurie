package com.roma.qurie.report.dto;

import com.roma.qurie.report.entity.SessionReport;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 종합 리포트의 세션 리포트 목록 행. */
public record SessionReportSummaryResponse(
        Long sessionReportId,
        Long sessionId,
        String sessionTitle,
        BigDecimal accuracy,
        BigDecimal quizRating,
        BigDecimal completionRate,
        LocalDateTime issuedAt) {

    public static SessionReportSummaryResponse from(SessionReport report, String sessionTitle) {
        return new SessionReportSummaryResponse(
                report.getId(),
                report.getSessionId(),
                sessionTitle,
                report.getAccuracy(),
                report.getQuizRating(),
                report.getCompletionRate(),
                report.getIssuedAt());
    }
}
