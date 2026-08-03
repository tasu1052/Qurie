package com.roma.qurie.config;

import com.roma.qurie.security.JwtAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 보안 설정.
 *
 * URL 단위 인가는 "로그인이 되어 있는가"까지만 본다. "어떤 역할인가", "그 리소스의 소유자인가" 같은
 * 세밀한 검증은 각 서비스가 계속 수동으로 한다(TrackService.requireMaster 등) — 반 소속처럼 리소스를
 * 읽어야 판단할 수 있는 규칙이 많아, URL 패턴만으로는 흉내낼 수 없기 때문이다. 이 레이어가 막는 것은
 * "그 수동 검사를 아예 빼먹은 엔드포인트가 전체 공개로 남는" 사고다 — permitAll 이 기본값이면 검사를
 * 빼먹은 새 엔드포인트가 조용히 뚫린 채로 남지만, authenticated() 가 기본값이면 최소한 로그인은 강제된다.
 *
 * 화이트리스트(로그인 없이도 되는 요청):
 * - /api/auth/**            : 로그인 자체, 토큰 갱신/로그아웃(만료된 쿠키로도 호출돼야 함), me(비로그인
 *                              상태도 정상 응답 경로), 비밀번호 재설정(로그인 못 하는 사람이 부르는 경로)
 * - GET /api/invitations/*  : 초대 링크로 여는 가입 화면 미리보기 — 아직 계정이 없는 사람이 부른다
 * - POST /api/users         : 초대 기반 회원가입 — 역시 아직 계정이 없는 사람이 부른다
 * - POST /api/quiz/{id}/callback : AI 서버가 부르는 서버 간 콜백. 쿠키가 아니라 별도 공유 비밀
 *                              헤더(X-Ai-Callback-Secret)로 검증하므로 이 레이어에서는 막지 않는다
 * - OPTIONS /**             : CORS 프리플라이트. 브라우저가 자격 증명 없이 보내므로 막으면
 *                              크로스오리진 POST/PATCH/DELETE 가 전부 깨진다
 *
 * JWT 인증 필터는 미리 체인에 연결해, 유효한 쿠키가 오면 SecurityContext에 인증 정보가 채워지게 한다.
 *
 * CSRF: JWT를 헤더가 아니라 httpOnly 쿠키로 내려주는 방식이라 원칙적으로 CSRF 노출이 있지만,
 * ACCESS_TOKEN 쿠키의 SameSite=Lax가 cross-site POST/PUT/DELETE 요청에는 쿠키를 실어 보내지 않아
 * 1차 방어가 된다. 세션 상태가 없는 stateless API라 CSRF 토큰 기반 방어는 이번 단계에서 추가하지 않는다.
 *
 * CORS: 프론트(다른 origin)가 쿠키를 실어 보내야 하므로 allowCredentials를 켠다. 이 경우
 * Access-Control-Allow-Origin에 와일드카드를 쓸 수 없어 허용 origin을 설정값으로 명시한다.
 * WebSocket 핸드셰이크의 origin 검사는 WebSocketConfig가 따로 처리한다.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // sendError 로 만들어지는 모든 에러 응답(403/404/405...)은 /error 재디스패치를
                        // 거쳐 본문이 채워진다. 이 디스패치를 막으면 에러가 전부 본문 없는 401로 둔갑한다.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/invitations/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/quiz/*/callback").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /*
     * 로그인 안 된 요청이 authenticated() 에 막히면 여기로 온다. sendError로 서블릿 컨테이너의 에러
     * 디스패치(BasicErrorController)를 그대로 태워, 기존에 ResponseStatusException(UNAUTHORIZED, ...)이
     * 컨트롤러 안에서 던져졌을 때와 같은 응답 형식을 유지한다 — 이 레이어만 다른 모양의 401을 새로 만들지 않는다.
     */
    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) ->
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "로그인이 필요합니다.");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origin-patterns:https://d3alq9m5x08xk2.cloudfront.net/}") String allowedOriginPatterns) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(allowedOriginPatterns.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(Duration.ofHours(1));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
