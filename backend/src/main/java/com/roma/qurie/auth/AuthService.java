package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtTokenProvider;
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

    /* 마스터 계정으로 로그인한다. 매니저/학생(ordinary_user) 로그인은 그 엔티티가 만들어지는 다음 단계에서 추가한다. */
    @Transactional(readOnly = true)
    public AuthResult login(LoginRequest request) {
        Master master = masterRepository.findByEmail(request.email()).orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), master.getPassword())) {
            throw invalidCredentials();
        }
        AuthUser authUser = toAuthUser(master);
        String accessToken = jwtTokenProvider.generateAccessToken(authUser);
        return new AuthResult(accessToken, LoginResponse.from(authUser));
    }

    public LoginResponse me(AuthUser authUser) {
        if (authUser == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "로그인이 필요합니다.");
        }
        return LoginResponse.from(authUser);
    }

    private AuthUser toAuthUser(Master master) {
        return new AuthUser(
                master.getId(), MASTER_ROLE, master.getEnterprise().getId(), master.getEmail(), master.getName());
    }

    private AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}
