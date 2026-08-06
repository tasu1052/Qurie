package com.roma.qurie.report.dto;

import com.roma.qurie.report.entity.SessionReport;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 세션 단위 리포트 명단 한 행(학생별 발급 스냅샷). */
public record SessionReportRosterItemResponse(
        Long sessionReportId,
        Long ordinaryUserId,
        String userName,
        BigDecimal accuracy,
        BigDecimal quizRating,
        BigDecimal completionRate,
        LocalDateTime issuedAt) {

    public static SessionReportRosterItemResponse from(SessionReport report, String userName) {
        return new SessionReportRosterItemResponse(
                report.getId(),
                report.getOrdinaryUserId(),
                userName,
                report.getAccuracy(),
                report.getQuizRating(),
                report.getCompletionRate(),
                report.getIssuedAt());
    }
}
