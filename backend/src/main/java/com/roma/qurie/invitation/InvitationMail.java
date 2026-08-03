package com.roma.qurie.invitation;

import com.roma.qurie.user.entity.UserRole;
import java.time.LocalDateTime;

/**
 * 초대 메일 본문에 필요한 값만 담은 스냅샷.
 *
 * 발송이 다른 스레드에서 일어나므로 Invitation 엔티티를 그대로 넘길 수 없다 — classEntity 가 LAZY 라
 * 영속성 컨텍스트가 닫힌 뒤 접근하면 LazyInitializationException 이 난다. 트랜잭션 안에서 미리 읽어 둔다.
 */
public record InvitationMail(
		String email,
		String className,
		UserRole role,
		LocalDateTime expiresAt,
		String signUpUrl) {

	public static InvitationMail from(Invitation invitation, String signUpUrl) {
		return new InvitationMail(
				invitation.getEmail(),
				invitation.getClassEntity().getName(),
				invitation.getRole(),
				invitation.getExpiresAt(),
				signUpUrl);
	}
}
