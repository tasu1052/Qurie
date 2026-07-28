package com.roma.qurie.auth;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.master.Master;
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
    @JoinColumn(name = "master_id", nullable = false)
    private Master master;

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

    public void revoke() {
        this.revoked = true;
    }

    public boolean isValid() {
        return !revoked && expiresAt.isAfter(LocalDateTime.now());
    }
}
