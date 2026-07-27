package com.roma.qurie.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 액세스 토큰(JWT) 발급/파싱. 리프레시 토큰은 이번 범위에 없음(별도 작업 예정).
 */
@Component
public class JwtTokenProvider {

    private static final Duration ACCESS_TOKEN_EXPIRATION = Duration.ofHours(24);

    private final SecretKey key;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Duration getAccessTokenExpiration() {
        return ACCESS_TOKEN_EXPIRATION;
    }

    public String generateAccessToken(AuthUser authUser) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRATION.toMillis());
        return Jwts.builder()
                .subject(String.valueOf(authUser.id()))
                .claim("role", authUser.role())
                .claim("enterpriseId", authUser.enterpriseId())
                .claim("email", authUser.email())
                .claim("name", authUser.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            AuthUser authUser =
                    new AuthUser(
                            Long.valueOf(claims.getSubject()),
                            claims.get("role", String.class),
                            claims.get("enterpriseId", Long.class),
                            claims.get("email", String.class),
                            claims.get("name", String.class));
            return Optional.of(authUser);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
