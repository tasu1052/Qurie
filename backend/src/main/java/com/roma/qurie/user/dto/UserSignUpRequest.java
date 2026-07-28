package com.roma.qurie.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.roma.qurie.user.entity.UserRole;

/**
 * 회원가입 요청.
 *
 * todo: enterpriseId 와 role 을 요청 본문으로 받으면 가입자가 소속과 권한을 스스로 지정할 수 있다.
 *       초대 기능이 확정되면 초대 토큰에서 두 값을 읽도록 바꿔야 한다.
 */
public record UserSignUpRequest(
		@NotNull Long enterpriseId,

		@NotBlank @Email @Size(max = 255) String email,

		@NotBlank @Size(min = 8, max = 64) String password,

		@NotBlank @Size(max = 50) String name,

		@NotNull UserRole role) {
}
