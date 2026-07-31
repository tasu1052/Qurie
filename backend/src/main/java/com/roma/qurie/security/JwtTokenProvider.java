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
 * 액세스 토큰(JWT) 발급/파싱.
 *
 * 수명은 리프레시 토큰(2시간)보다 짧게 둔다 — 액세스 토큰은 폐기 수단이 없는 stateless 토큰이라
 * 로그아웃·비밀번호 변경으로 무효화할 수 없고, 만료를 기다리는 것이 유일한 회수 수단이다.
 * 또한 짧게 둘수록 role·classId·name 클레임이 낡아 있는 시간(재로그인 없이 반영 안 되는 창)도 줄어든다.
 */
@Component
public class JwtTokenProvider {

    private static final Duration ACCESS_TOKEN_EXPIRATION = Duration.ofMinutes(30);

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
                .claim("classId", authUser.classId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            // classId 클레임이 없던 기존 토큰도 파싱되어야 하므로 null 을 허용한다 (마스터·반 미배정 사용자도 null).
            AuthUser authUser =
                    new AuthUser(
                            Long.valueOf(claims.getSubject()),
                            claims.get("role", String.class),
                            claims.get("enterpriseId", Long.class),
                            claims.get("email", String.class),
                            claims.get("name", String.class),
                            claims.get("classId", Long.class));
            return Optional.of(authUser);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
