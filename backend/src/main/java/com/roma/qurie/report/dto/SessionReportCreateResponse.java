package com.roma.qurie.report.dto;

import java.time.LocalDateTime;

import com.roma.qurie.report.entity.SessionReport;

public record SessionReportCreateResponse(
        Long sessionReportId,
        Long sessionId,
        Long ordinaryUserId,
        LocalDateTime issuedAt) {

    public static SessionReportCreateResponse from(SessionReport sessionReport) {
        return new SessionReportCreateResponse(
                sessionReport.getId(),
                sessionReport.getSessionId(),
                sessionReport.getOrdinaryUserId(),
                sessionReport.getIssuedAt());
    }
}
