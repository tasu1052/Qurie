package com.roma.qurie.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 그룹 수정 요청. PUT(전체 교체) 계약이라 소속 반을 제외한 모든 필드를 다시 받는다.
 */
public record GroupUpdateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 255) String description,
        @NotNull LocalDateTime startedAt,
        @NotNull LocalDateTime endedAt) {}
