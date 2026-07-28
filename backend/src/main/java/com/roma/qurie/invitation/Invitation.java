package com.roma.qurie.invitation;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.master.Master;
import com.roma.qurie.user.entity.User;
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
 * 초대장. role, invitedByMaster, invitedByUser, classEntity로 마스터-매니저, 매니저-학생 두 흐름을 하나의 테이블로 표현한다.
 * classEntity/invitedByMaster/invitedByUser 중 정확히 하나(또는 정해진 조합)만 채워지는 게 규칙이라,
 * 생성자를 감추고 forManagerInvite/forStudentInvite 정적 팩토리로만 만들 수 있게 한다.
 */
@Entity
@Table(name = "invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Invitation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private InvitationRole role;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvitationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_master_id")
    private Master invitedByMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id")
    private User invitedByUser;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    private Invitation(
            Enterprise enterprise,
            ClassEntity classEntity,
            InvitationRole role,
            String email,
            String token,
            Master invitedByMaster,
            User invitedByUser,
            LocalDateTime expiresAt) {
        this.enterprise = enterprise;
        this.classEntity = classEntity;
        this.role = role;
        this.email = email;
        this.token = token;
        this.status = InvitationStatus.PENDING;
        this.invitedByMaster = invitedByMaster;
        this.invitedByUser = invitedByUser;
        this.expiresAt = expiresAt;
    }

    public static Invitation forManagerInvite(
            Enterprise enterprise, String email, String token, Master invitedBy, LocalDateTime expiresAt) {
        return new Invitation(enterprise, null, InvitationRole.MANAGER, email, token, invitedBy, null, expiresAt);
    }

    public static Invitation forStudentInvite(
            Enterprise enterprise,
            ClassEntity classEntity,
            String email,
            String token,
            User invitedBy,
            LocalDateTime expiresAt) {
        return new Invitation(
                enterprise, classEntity, InvitationRole.STUDENT, email, token, null, invitedBy, expiresAt);
    }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    /** 초대 수락(회원가입 완료) 처리. 회원가입 연동 전이라 현재는 호출부가 없다. */
    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }
}
