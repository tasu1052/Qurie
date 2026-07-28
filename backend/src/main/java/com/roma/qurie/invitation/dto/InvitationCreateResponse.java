package com.roma.qurie.invitation.dto;

import com.roma.qurie.invitation.Invitation;
import com.roma.qurie.user.entity.UserRole;
import java.time.LocalDateTime;

/**
 * 초대 생성 결과. token 과 signUpUrl 은 이 응답에서만 나간다 — DB 에는 해시만 남아 다시 조회할 수 없다.
 * 메일 발송이 붙기 전까지는 이 링크를 수동으로 전달한다.
 */
public record InvitationCreateResponse(
		Long id,
		String email,
		UserRole role,
		Long classId,
		String className,
		LocalDateTime expiresAt,
		String token,
		String signUpUrl) {

	public static InvitationCreateResponse of(Invitation invitation, String rawToken, String signUpUrl) {
		return new InvitationCreateResponse(
				invitation.getId(),
				invitation.getEmail(),
				invitation.getRole(),
				invitation.getClassEntity().getId(),
				invitation.getClassEntity().getName(),
				invitation.getExpiresAt(),
				rawToken,
				signUpUrl);
	}
}
