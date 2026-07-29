package com.roma.qurie.group.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 그룹 편집 요청. 제목·설명·운영 기간·구성원을 한 화면에서 저장하므로 보낸 항목만 반영한다.
 *
 * memberIds 는 부분 추가가 아니라 최종 명단이다 — 화면이 반 인원 전체를 보여주고 체크로 고르는 방식이라
 * 빠진 사람은 그룹에서 제외된다. 빈 배열을 보내면 전원 제외이고, 생략(null)하면 구성원은 건드리지 않는다.
 */
public record GroupEditRequest(
        @Size(max = 100) String name,
        @Size(max = 255) String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        List<Long> memberIds,
        Long leaderId) {

    public boolean hasName() {
        return name != null;
    }

    public boolean hasDescription() {
        return description != null;
    }

    public boolean hasPeriod() {
        return startedAt != null || endedAt != null;
    }

    public boolean hasMembers() {
        return memberIds != null;
    }

    public boolean hasAnyField() {
        return hasName() || hasDescription() || hasPeriod() || hasMembers() || leaderId != null;
    }
}
