package com.roma.qurie.session.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 방 생성 요청. slug 는 방 제목이다.
 * 생성자는 인증 정보(AuthUser)에서 가져오므로 요청 본문으로 받지 않는다 — 받으면 남의 id 로 방을 만들 수 있다.
 */
public record SessionCreateRequest(
        @NotNull Long classId,
        @NotBlank @Size(max = 100) String title) {}
