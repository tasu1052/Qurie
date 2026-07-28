package com.roma.qurie.analytics.dto;

/**
 * 마스터 대시보드 상단 KPI 4종. 저장하지 않고 조회 시점에 집계한다.
 */
public record AnalyticsOverviewResponse(
        long trackCount,
        long activeClassCount,
        long managerCount,
        long studentCount) {}
