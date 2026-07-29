package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.classes.ClassUser;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtTokenProvider;
import com.roma.qurie.security.RefreshTokenProvider;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
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
    private final UserRepository userRepository;
    private final ClassUserRepository classUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenProvider refreshTokenProvider;

    /** 이메일로 마스터를 먼저 찾고, 없으면 매니저/학생(ordinary_user)을 찾아 로그인한다. */
    @Transactional
    public AuthResult login(LoginRequest request) {
        Optional<Master> master = masterRepository.findByEmail(request.email());
        if (master.isPresent()) {
            if (!passwordEncoder.matches(request.password(), master.get().getPassword())) {
                throw invalidCredentials();
            }
            return issueTokens(master.get());
        }
        User user = userRepository.findByEmail(request.email()).orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw invalidCredentials();
        }
        return issueTokens(user);
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
        if (refreshToken.getMaster() != null) {
            return issueTokens(refreshToken.getMaster());
        }
        return issueTokens(refreshToken.getUser());
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
        String rawRefreshToken = generateRefreshToken();
        String tokenHash = refreshTokenProvider.hash(rawRefreshToken);
        refreshTokenRepository.save(new RefreshToken(master, tokenHash, refreshTokenExpiry()));
        String accessToken = jwtTokenProvider.generateAccessToken(authUser);
        return new AuthResult(accessToken, rawRefreshToken, LoginResponse.from(authUser));
    }

    private AuthResult issueTokens(User user) {
        AuthUser authUser = toAuthUser(user);
        String rawRefreshToken = generateRefreshToken();
        String tokenHash = refreshTokenProvider.hash(rawRefreshToken);
        refreshTokenRepository.save(new RefreshToken(user, tokenHash, refreshTokenExpiry()));
        String accessToken = jwtTokenProvider.generateAccessToken(authUser);
        return new AuthResult(accessToken, rawRefreshToken, LoginResponse.from(authUser));
    }

    private String generateRefreshToken() {
        return refreshTokenProvider.generateToken();
    }

    private LocalDateTime refreshTokenExpiry() {
        return LocalDateTime.now().plus(refreshTokenProvider.getExpiration());
    }

    /** 마스터는 반 명단(class_users)에 담기지 않으므로 classId 는 항상 null 이다. */
    private AuthUser toAuthUser(Master master) {
        return new AuthUser(
                master.getId(), MASTER_ROLE, master.getEnterprise().getId(), master.getEmail(), master.getName(),
                null);
    }

    private AuthUser toAuthUser(User user) {
        Long classId = classUserRepository.findFirstByUserIdOrderByIdDesc(user.getId())
                .map(ClassUser::getClassEntity)
                .map(classEntity -> classEntity.getId())
                .orElse(null);
        return new AuthUser(
                user.getId(), user.getRole().name(), user.getEnterpriseId(), user.getEmail(), user.getName(),
                classId);
    }

    private AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}
