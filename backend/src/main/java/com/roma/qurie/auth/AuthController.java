package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtAuthenticationFilter;
import com.roma.qurie.security.JwtTokenProvider;
import com.roma.qurie.security.RefreshTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "REFRESH_TOKEN";

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenProvider refreshTokenProvider;

    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    /** 로그인. 성공 시 액세스/리프레시 토큰을 httpOnly 쿠키로 내려준다. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request);
        return withTokenCookies(result);
    }

    /** 리프레시 토큰으로 액세스 토큰을 재발급한다. 기존 리프레시 토큰은 폐기되고 새로 발급된다(회전). */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REQUIRED", "리프레시 토큰이 없습니다.");
        }
        AuthResult result = authService.refresh(refreshToken);
        return withTokenCookies(result);
    }

    /** 로그아웃. 리프레시 토큰을 폐기하고 쿠키를 지운다. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        ResponseCookie expiredAccessTokenCookie = expireCookie(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE_NAME, "/");
        ResponseCookie expiredRefreshTokenCookie = expireCookie(REFRESH_TOKEN_COOKIE_NAME, "/api/auth");
        return ResponseEntity.noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        expiredAccessTokenCookie.toString(),
                        expiredRefreshTokenCookie.toString())
                .build();
    }

    /** 현재 로그인한 사용자 정보. httpOnly 쿠키라 프론트가 직접 못 읽으므로 셸 렌더링에 사용한다. */
    @GetMapping("/me")
    public LoginResponse me(@AuthenticationPrincipal AuthUser authUser) {
        return authService.me(authUser);
    }

    private ResponseCookie expireCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path(path)
                .maxAge(0)
                .build();
    }

    private ResponseEntity<LoginResponse> withTokenCookies(AuthResult result) {
        ResponseCookie accessTokenCookie = buildAccessTokenCookie(result.accessToken());
        ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(result.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString(), refreshTokenCookie.toString())
                .body(result.user());
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

    private ResponseCookie buildRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(refreshTokenProvider.getExpiration())
                .build();
    }
}
