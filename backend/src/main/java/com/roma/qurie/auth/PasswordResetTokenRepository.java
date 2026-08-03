package com.roma.qurie.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** 최신순 — 맨 앞이 쿨다운 판단 대상이고, 나머지 전부는 새 토큰 발급 시 무효화 대상이다. */
    List<PasswordResetToken> findAllByMasterIdAndUsedFalseOrderByCreatedAtDesc(Long masterId);

    List<PasswordResetToken> findAllByUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);
}
