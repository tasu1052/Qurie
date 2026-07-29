package com.roma.qurie.track.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 트랙 수정 요청. PUT(전체 교체) 계약이라 생성과 같은 필드를 전부 받는다.
 */
public record TrackUpdateRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 255) String description,
        @Size(max = 20) String tech) {}
