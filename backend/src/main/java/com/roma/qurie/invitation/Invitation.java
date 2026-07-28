package com.roma.qurie.invitation;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.user.entity.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메일로 보내는 가입 초대. 초대 링크의 토큰이 곧 "이 이메일로, 이 반에, 이 역할로 가입해도 된다"는 증표라
 * 가입 요청은 email/role/classId 를 받지 않고 이 행에서 읽는다.
 *
 * 토큰 원문은 저장하지 않고 해시만 저장한다(RefreshToken 과 동일). 원문은 초대 생성 응답에서 한 번만 나간다.
 * invited_by 는 마스터(masters)와 매니저(ordinary_users)가 별도 테이블이라 FK 하나로 못 묶어
 * 두 컬럼으로 나누고, 감사 목적이라 연관관계 대신 FK 값(Long)으로 둔다.
 */
@Entity
@Table(name = "invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Invitation extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "token_hash", nullable = false, unique = true, length = 64)
	private String tokenHash;

	@Column(name = "email", nullable = false, length = 255)
	private String email;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "class_id", nullable = false)
	private ClassEntity classEntity;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private UserRole role;

	@Column(name = "invited_by_master_id")
	private Long invitedByMasterId;

	@Column(name = "invited_by_user_id")
	private Long invitedByUserId;

	@Column(name = "expires_at", nullable = false)
	private LocalDateTime expiresAt;

	@Column(name = "accepted_at")
	private LocalDateTime acceptedAt;

	private Invitation(
			String tokenHash,
			String email,
			ClassEntity classEntity,
			UserRole role,
			LocalDateTime expiresAt) {
		this.tokenHash = tokenHash;
		this.email = email;
		this.classEntity = classEntity;
		this.role = role;
		this.expiresAt = expiresAt;
	}

	public static Invitation byMaster(
			String tokenHash,
			String email,
			ClassEntity classEntity,
			UserRole role,
			LocalDateTime expiresAt,
			Long masterId) {
		Invitation invitation = new Invitation(tokenHash, email, classEntity, role, expiresAt);
		invitation.invitedByMasterId = masterId;
		return invitation;
	}

	public static Invitation byUser(
			String tokenHash,
			String email,
			ClassEntity classEntity,
			UserRole role,
			LocalDateTime expiresAt,
			Long userId) {
		Invitation invitation = new Invitation(tokenHash, email, classEntity, role, expiresAt);
		invitation.invitedByUserId = userId;
		return invitation;
	}

	public boolean isPending() {
		return acceptedAt == null && expiresAt.isAfter(LocalDateTime.now());
	}

	public void accept() {
		this.acceptedAt = LocalDateTime.now();
	}

	/** 가입할 사용자의 소속 기업. 반이 속한 트랙의 기업을 그대로 따른다. */
	public Long enterpriseId() {
		return classEntity.getTrack().getEnterprise().getId();
	}
}
