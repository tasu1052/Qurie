package com.roma.qurie.user.dto;

import java.time.LocalDateTime;

import com.roma.qurie.master.Master;
import com.roma.qurie.user.entity.User;

/**
 * 마이페이지 응답. 마스터(masters)와 매니저/학생(ordinary_users)이 같은 화면을 쓰므로 role 은
 * UserRole(MASTER 없음)이 아니라 문자열로 내려 두 계정 유형을 모두 담는다. enum 도 이름 그대로
 * 직렬화되므로 기존 JSON 과 동일하다.
 */
public record UserProfileResponse(
		Long userId,
		Long enterpriseId,
		String email,
		String name,
		String role,
		String phone,
		String region,
		String gender,
		String theme,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {

	public static UserProfileResponse from(User user) {
		return new UserProfileResponse(
				user.getId(),
				user.getEnterpriseId(),
				user.getEmail(),
				user.getName(),
				user.getRole().name(),
				user.getPhone(),
				user.getRegion(),
				user.getGender(),
				user.getTheme(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}

	public static UserProfileResponse from(Master master) {
		return new UserProfileResponse(
				master.getId(),
				master.getEnterprise().getId(),
				master.getEmail(),
				master.getName(),
				"MASTER",
				master.getPhone(),
				master.getRegion(),
				master.getGender(),
				master.getTheme(),
				master.getCreatedAt(),
				master.getUpdatedAt());
	}
}
