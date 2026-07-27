package com.roma.qurie.config;

import com.roma.qurie.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 보안 설정. session 등 다른 도메인이 아직 인증을 다루지 않으므로 엔드포인트 접근 제어는
 * 여전히 전부 permitAll로 둔다 — 실제 보호가 필요한 첫 엔드포인트(초대 생성)를 만들 때 교체할 것.
 * JWT 인증 필터는 미리 체인에 연결해, 유효한 쿠키가 오면 SecurityContext에 인증 정보가 채워지게 한다.
 *
 * CSRF: JWT를 헤더가 아니라 httpOnly 쿠키로 내려주는 방식이라 원칙적으로 CSRF 노출이 있지만,
 * ACCESS_TOKEN 쿠키의 SameSite=Lax가 cross-site POST/PUT/DELETE 요청에는 쿠키를 실어 보내지 않아
 * 1차 방어가 된다. 세션 상태가 없는 stateless API라 CSRF 토큰 기반 방어는 이번 단계에서 추가하지 않는다.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
