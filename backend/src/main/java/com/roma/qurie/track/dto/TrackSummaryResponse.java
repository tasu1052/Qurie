package com.roma.qurie.track.dto;

/**
 * 마스터 대시보드 트랙 카드 및 트랙 목록 화면용 요약. classCount는 조회 시점에 집계한다.
 */
public record TrackSummaryResponse(
        Long id,
        String name,
        String description,
        String tech,
        Long classCount) {}
