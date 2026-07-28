package com.roma.qurie.track.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 트랙 생성 요청. 소속 기업은 클라이언트가 보내지 않고 JWT의 enterpriseId로 서버가 결정한다.
 */
public record TrackCreateRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 255) String description,
        @Size(max = 20) String tech) {}
