package com.roma.qurie.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 회원가입 요청. 메일로 받은 초대 링크의 토큰을 그대로 보낸다.
 *
 * 이메일·역할·소속 반은 초대에 이미 정해져 있어 받지 않는다 — 받으면 가입자가 자기 소속과 권한을
 * 스스로 지정할 수 있다.
 */
public record UserSignUpRequest(
		@NotBlank String token,

		@NotBlank @Size(min = 8, max = 64) String password,

		@NotBlank @Size(max = 50) String name) {
}
