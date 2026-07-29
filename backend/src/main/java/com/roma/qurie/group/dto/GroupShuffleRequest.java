package com.roma.qurie.group.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 랜덤 배정 요청. 대상 그룹들에 반 인원을 무작위로 나눠 담는다.
 *
 * 배정은 덮어쓰기다 — 대상 그룹의 기존 구성원은 모두 지워지고 새로 채워진다.
 * assignLeader 가 true 면 각 그룹에서 한 명을 LEADER 로 뽑는다.
 */
public record GroupShuffleRequest(
        @NotEmpty List<Long> groupIds,
        Boolean assignLeader) {

    public boolean shouldAssignLeader() {
        return Boolean.TRUE.equals(assignLeader);
    }
}
