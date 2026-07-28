package com.roma.qurie.classes.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 클래스 생성 요청. 소속 기업은 trackId가 속한 트랙에서 서버가 확인하며 클라이언트가 보내지 않는다.
 */
public record ClassCreateRequest(
        @NotNull Long trackId,
        @NotNull @Min(1) Integer classNumber,
        @NotBlank @Size(max = 50) String name,
        @Min(1) Integer capacity,
        @Size(max = 255) String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt) {}
