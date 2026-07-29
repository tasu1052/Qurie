package com.roma.qurie.group.dto;

/**
 * 그룹 편집 화면의 배정 후보. 반 명단 전체가 나오며, 이미 다른 그룹에 속해 있으면
 * currentGroupId·currentGroupName 이 채워진다("정유진 — 현재 그룹 B"). 미배정이면 null 이다.
 */
public record GroupMemberCandidateResponse(
        Long userId,
        String name,
        String email,
        Long currentGroupId,
        String currentGroupName) {}
