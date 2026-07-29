package com.roma.qurie.group.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 랜덤 배정 요청. 모달에서 받은 그룹 수만큼 그룹을 새로 만들고 반의 학생을 무작위로 나눠 담는다.
 *
 * 반에 이미 그룹 배정된 인원이 있으면 409 로 거절한다 — 프론트가 "그래도 셔플하시겠습니까?" 경고를
 * 띄운 뒤 confirmed=true 로 다시 호출하면 기존 배정을 비우고 진행한다.
 *
 * 새 그룹의 운영 기간은 요청 값을 쓰고, 없으면 반의 운영 기간을 물려받는다. 둘 다 없으면 400 이다.
 */
public record GroupShuffleRequest(
        @NotNull @Min(1) @Max(50) Integer groupCount,
        Boolean assignLeader,
        Boolean confirmed,
        LocalDateTime startedAt,
        LocalDateTime endedAt) {

    public boolean shouldAssignLeader() {
        return Boolean.TRUE.equals(assignLeader);
    }

    public boolean isConfirmed() {
        return Boolean.TRUE.equals(confirmed);
    }
}
