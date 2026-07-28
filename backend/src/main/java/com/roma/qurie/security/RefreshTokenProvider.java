package com.roma.qurie.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

/**
 * 리프레시 토큰 원문 생성 및 해시. JWT가 아닌 고엔트로피 랜덤 문자열이다 — 유효성은
 * DB의 RefreshToken row(해시로 조회)로 판단하므로 자체 서명/검증이 필요 없다.
 * 원문은 응답 쿠키로만 내려가고 DB에는 해시만 저장한다(비밀번호와 동일하게 취급).
 */
@Component
public class RefreshTokenProvider {

    private static final Duration REFRESH_TOKEN_EXPIRATION = Duration.ofDays(14);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public Duration getExpiration() {
        return REFRESH_TOKEN_EXPIRATION;
    }

    public String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
