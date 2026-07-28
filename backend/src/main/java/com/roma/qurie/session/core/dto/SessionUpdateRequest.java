package com.roma.qurie.session.core.dto;

import jakarta.validation.constraints.Size;

/**
 * 방 수정 요청. null 인 필드는 변경하지 않는다.
 * slug = 방 제목, active = 활성/종료 여부.
 */
public record SessionUpdateRequest(
        @Size(max = 100) String title,
        Boolean active) {}
