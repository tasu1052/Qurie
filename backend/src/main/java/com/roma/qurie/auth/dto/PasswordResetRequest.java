package com.roma.qurie.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** 비밀번호 재설정 요청(1단계). 이메일 존재 여부와 무관하게 항상 같은 응답을 준다 — 계정 존재를 노출하지 않는다. */
public record PasswordResetRequest(@NotBlank @Email String email) {
}
