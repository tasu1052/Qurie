package com.roma.qurie.report.dto;

/** 세션 리포트 일괄 발급 결과. */
public record SessionReportBulkResponse(Long sessionId, int issuedCount) {
}
