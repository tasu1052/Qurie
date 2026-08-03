package com.roma.qurie.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * 비밀번호 재설정 직후 기존 로그인 세션을 전부 끊기 위해 쓴다 — 비밀번호가 유출돼서 재설정한
     * 경우라면 이미 발급된 리프레시 토큰도 함께 무효화해야 탈취된 세션이 안 끊긴 채로 남지 않는다.
     */
    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.master.id = :masterId and r.revoked = false")
    void revokeAllByMasterId(@Param("masterId") Long masterId);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.user.id = :userId and r.revoked = false")
    void revokeAllByUserId(@Param("userId") Long userId);
}
