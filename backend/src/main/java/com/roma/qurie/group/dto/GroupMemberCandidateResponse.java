package com.roma.qurie.group.dto;

/**
 * 그룹 배정 후보. 아직 어느 그룹에도 속하지 않은 반의 학생만 담긴다 —
 * 한 학생은 반에서 그룹 하나에만 속하므로 이미 배정된 학생은 후보가 될 수 없다.
 *
 * 편집 중인 그룹의 현재 구성원은 GroupDetailResponse.members 로 따로 내려간다.
 */
public record GroupMemberCandidateResponse(Long userId, String name, String email) {}
