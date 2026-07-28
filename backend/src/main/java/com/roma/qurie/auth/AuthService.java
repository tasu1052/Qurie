package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtTokenProvider;
import com.roma.qurie.security.RefreshTokenProvider;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String MASTER_ROLE = "MASTER";

    private final MasterRepository masterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenProvider refreshTokenProvider;

    /* 마스터 계정으로 로그인한다. 매니저/학생(ordinary_user) 로그인은 그 엔티티가 만들어지는 다음 단계에서 추가한다. */
    @Transactional
    public AuthResult login(LoginRequest request) {
        Master master = masterRepository.findByEmail(request.email()).orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), master.getPassword())) {
            throw invalidCredentials();
        }
        return issueTokens(master);
    }

    /** 리프레시 토큰으로 액세스 토큰을 재발급한다. 탈취 재사용 방지를 위해 기존 토큰은 폐기하고 새로 발급한다(회전). */
    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenHash(refreshTokenProvider.hash(rawRefreshToken))
                .filter(RefreshToken::isValid)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "유효하지 않은 리프레시 토큰입니다."));
        refreshToken.revoke();
        return issueTokens(refreshToken.getMaster());
    }

    /** 로그아웃. 해당 리프레시 토큰을 폐기한다. 쿠키가 없거나 이미 폐기/존재하지 않는 토큰이어도 그냥 성공 처리한다(멱등). */
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null) {
            return;
        }
        refreshTokenRepository
                .findByTokenHash(refreshTokenProvider.hash(rawRefreshToken))
                .ifPresent(RefreshToken::revoke);
    }

    public LoginResponse me(AuthUser authUser) {
        if (authUser == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "로그인이 필요합니다.");
        }
        return LoginResponse.from(authUser);
    }

    private AuthResult issueTokens(Master master) {
        AuthUser authUser = toAuthUser(master);
        String accessToken = jwtTokenProvider.generateAccessToken(authUser);
        String rawRefreshToken = refreshTokenProvider.generateToken();
        LocalDateTime expiresAt = LocalDateTime.now().plus(refreshTokenProvider.getExpiration());
        refreshTokenRepository.save(
                new RefreshToken(master, refreshTokenProvider.hash(rawRefreshToken), expiresAt));
        return new AuthResult(accessToken, rawRefreshToken, LoginResponse.from(authUser));
    }

    private AuthUser toAuthUser(Master master) {
        return new AuthUser(
                master.getId(), MASTER_ROLE, master.getEnterprise().getId(), master.getEmail(), master.getName());
    }

    private AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}
