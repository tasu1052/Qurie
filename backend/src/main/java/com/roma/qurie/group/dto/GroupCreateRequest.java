package com.roma.qurie.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 그룹 생성 요청. 인증이 붙기 전까지는 classId 를 요청 본문으로 받는다.
 */
public record GroupCreateRequest(
        @NotNull Long classId,
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 255) String description,
        @NotNull LocalDateTime startedAt,
        @NotNull LocalDateTime endedAt) {}
