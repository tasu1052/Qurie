package com.roma.qurie.invitation.dto;

import com.roma.qurie.invitation.Invitation;
import com.roma.qurie.user.entity.UserRole;
import java.time.LocalDateTime;

/**
 * 초대 링크로 열린 회원가입 화면을 채우기 위한 조회 결과.
 * 이메일과 반은 초대에 이미 정해져 있어 가입자가 입력하지 않고 읽기 전용으로 보여준다.
 */
public record InvitationPreviewResponse(
		String email,
		UserRole role,
		Long classId,
		String className,
		LocalDateTime expiresAt) {

	public static InvitationPreviewResponse from(Invitation invitation) {
		return new InvitationPreviewResponse(
				invitation.getEmail(),
				invitation.getRole(),
				invitation.getClassEntity().getId(),
				invitation.getClassEntity().getName(),
				invitation.getExpiresAt());
	}
}
