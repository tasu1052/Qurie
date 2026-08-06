package com.roma.qurie.user.dto;

import jakarta.validation.constraints.Size;

/**
 * 마이페이지 정보 수정 요청. PATCH 이므로 보내지 않은(null) 항목은 수정하지 않는다.
 * 이메일은 로그인 식별자이자 unique 값이라 이 API에서 바꾸지 않고, 소속 기업과 역할도 본인이 바꿀 수 없다.
 * phone/region/gender 는 선택 항목이라 빈 문자열을 보내면 값을 지운 것으로 처리한다.
 * theme 은 light|dark 만 허용한다.
 */
public record UserProfileUpdateRequest(
		@Size(max = 50) String name,

		String currentPassword,

		@Size(min = 8, max = 64) String newPassword,

		@Size(max = 30) String phone,

		@Size(max = 50) String region,

		@Size(max = 10) String gender,

		@Size(max = 10) String theme) {

	public boolean hasName() {
		return name != null;
	}

	public boolean hasNewPassword() {
		return newPassword != null;
	}

	public boolean hasPhone() {
		return phone != null;
	}

	public boolean hasRegion() {
		return region != null;
	}

	public boolean hasGender() {
		return gender != null;
	}

	public boolean hasTheme() {
		return theme != null;
	}

	public boolean hasAnyUpdate() {
		return hasName() || hasNewPassword() || hasPhone() || hasRegion() || hasGender() || hasTheme();
	}
}
