package com.roma.qurie.auth;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.master.Master;
import com.roma.qurie.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * 발급된 리프레시 토큰. 원문은 저장하지 않고 해시만 저장한다.
 * revoked=true 이거나 만료됐으면 재발급에 사용할 수 없다.
 * master/user 중 정확히 하나만 채워진다 — master(마스터)와 user(매니저/학생)가 별도 테이블이라
 * FK 하나로 못 묶어서 invitation.invited_by와 같은 방식으로 나눴다.
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id")
    private Master master;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    public RefreshToken(Master master, String tokenHash, LocalDateTime expiresAt) {
        this.master = master;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.revoked = false;
    }

    public RefreshToken(User user, String tokenHash, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.revoked = false;
    }

    public void revoke() {
        this.revoked = true;
    }

    public boolean isValid() {
        return !revoked && expiresAt.isAfter(LocalDateTime.now());
    }
}
