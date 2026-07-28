package com.roma.qurie.user.dto;

import java.time.LocalDateTime;

import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;

public record UserProfileResponse(
		Long userId,
		Long enterpriseId,
		String email,
		String name,
		UserRole role,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {

	public static UserProfileResponse from(User user) {
		return new UserProfileResponse(
				user.getId(),
				user.getEnterpriseId(),
				user.getEmail(),
				user.getName(),
				user.getRole(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}
}
