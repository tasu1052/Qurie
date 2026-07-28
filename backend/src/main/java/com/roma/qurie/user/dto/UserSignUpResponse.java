package com.roma.qurie.user.dto;

import java.time.LocalDateTime;

import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;

public record UserSignUpResponse(
		Long userId,
		Long enterpriseId,
		String email,
		String name,
		UserRole role,
		LocalDateTime createdAt) {

	public static UserSignUpResponse from(User user) {
		return new UserSignUpResponse(
				user.getId(),
				user.getEnterpriseId(),
				user.getEmail(),
				user.getName(),
				user.getRole(),
				user.getCreatedAt());
	}
}
