package com.roma.qurie.project.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 프로젝트 생성 요청. 인증이 붙기 전까지는 importedBy 를 요청 본문으로 받는다.
 * path 는 Git 연동 미확정으로 선택 값이다.
 */
public record ProjectCreateRequest(
        @NotNull Long sessionId,
        @Size(max = 500) String path,
        @NotNull Long importedBy) {}
