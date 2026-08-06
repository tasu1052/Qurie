package com.roma.qurie.report.dto;

import java.util.List;

/** 세션에 발급된 학생 리포트 전체 명단. */
public record SessionReportRosterResponse(
        Long sessionId,
        String sessionTitle,
        int issuedCount,
        Double avgAccuracy,
        Double avgCompletionRate,
        List<SessionReportRosterItemResponse> reports) {
}
