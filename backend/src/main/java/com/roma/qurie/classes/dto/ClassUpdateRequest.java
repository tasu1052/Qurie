package com.roma.qurie.classes.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 클래스 수정 요청. PATCH(부분 수정) 계약이라 모든 필드가 선택이며 보낸 항목만 반영한다.
 * 트랙 이동(trackId 변경)은 반 번호 고유 범위가 바뀌는 문제가 있어 지원하지 않는다.
 */
public record ClassUpdateRequest(
        @Min(1) Integer classNumber,
        @Size(max = 50) String name,
        @Min(1) Integer capacity,
        @Size(max = 255) String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt) {

    public boolean hasClassNumber() {
        return classNumber != null;
    }

    public boolean hasName() {
        return name != null;
    }

    public boolean hasCapacity() {
        return capacity != null;
    }

    public boolean hasDescription() {
        return description != null;
    }

    public boolean hasPeriod() {
        return startedAt != null || endedAt != null;
    }

    public boolean hasAnyField() {
        return hasClassNumber() || hasName() || hasCapacity() || hasDescription() || hasPeriod();
    }
}
