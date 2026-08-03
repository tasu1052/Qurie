package com.roma.qurie.analytics.dto;

/**
 * 클래스 상세 화면의 분석 요약. 저장하지 않고 조회 시점에 집계한다(overview 와 같은 방식).
 *
 * 학습 지표(정답률·완료율)는 user_reports 에 기록된 학생만 반영하므로, 몇 명분이 반영됐는지를
 * reportedStudentCount 로 함께 내려준다 — 분모를 모르면 "정답률 40%"가 반 전체인지 한 명인지 알 수 없다.
 * 아직 리포트가 없으면 평균은 null 이다(0 으로 내리면 "정답률 0%"로 오해된다).
 */
public record ClassAnalyticsResponse(
        Long classId,
        long studentCount,
        long managerCount,
        long groupCount,
        long sessionCount,
        long activeSessionCount,
        long reportedStudentCount,
        Double avgAccuracy,
        Double avgCompletionRate,
        Integer avgElapsedMs) {}
