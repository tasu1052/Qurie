package com.roma.qurie.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 방 생성 요청. slug 는 방 제목이다.
 * 인증이 붙기 전까지는 createdBy 를 요청 본문으로 받는다.
 */
public record SessionCreateRequest(
        @NotNull Long classId,
        @NotBlank @Size(max = 100) String title,
        @NotNull Long createdBy) {}
