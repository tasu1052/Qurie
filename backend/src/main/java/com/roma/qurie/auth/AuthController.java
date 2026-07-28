package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtAuthenticationFilter;
import com.roma.qurie.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    /** 로그인. 성공 시 액세스 토큰을 httpOnly 쿠키로 내려준다. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request);
        ResponseCookie cookie = buildAccessTokenCookie(result.accessToken());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(result.user());
    }

    /** 현재 로그인한 사용자 정보. httpOnly 쿠키라 프론트가 직접 못 읽으므로 셸 렌더링에 사용한다. */
    @GetMapping("/me")
    public LoginResponse me(@AuthenticationPrincipal AuthUser authUser) {
        return authService.me(authUser);
    }

    private ResponseCookie buildAccessTokenCookie(String accessToken) {
        return ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE_NAME, accessToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtTokenProvider.getAccessTokenExpiration())
                .build();
    }
}
