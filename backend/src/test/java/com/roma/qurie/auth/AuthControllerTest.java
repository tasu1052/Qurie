package com.roma.qurie.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.auth.dto.LoginResponse;
import com.roma.qurie.config.SecurityConfig;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * SecurityConfig/JwtTokenProvider를 실제 빈으로 띄워 실제 필터 체인을 그대로 태운다.
 * @AuthenticationPrincipal 해석이 SecurityConfig의 SecurityFilterChain 빈 존재 여부에 달려 있어,
 * 목(mock)으로 대체하면 인증된 요청 테스트가 항상 principal=null이 되어 버린다.
 */
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class})
@TestPropertySource(properties = "jwt.secret=test-only-secret-key-must-be-at-least-32-bytes-long!!")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private AuthService authService;

    @Test
    void login_성공하면_ACCESS_TOKEN_쿠키와_사용자정보를_반환한다() throws Exception {
        LoginResponse user = new LoginResponse(1L, "김대표", "master@test.com", "MASTER", 1L);
        given(authService.login(any())).willReturn(new AuthResult("token-value", user));

        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        new LoginRequest("master@test.com", "plain-password"))))
                        .andExpect(status().isOk())
                        .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie)
                .contains("ACCESS_TOKEN=token-value", "Path=/", "HttpOnly", "SameSite=Lax")
                .doesNotContain("Secure");

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("role").asText()).isEqualTo("MASTER");
        assertThat(body.get("email").asText()).isEqualTo("master@test.com");
    }

    @Test
    void login_실패하면_에러포맷으로_401을_반환한다() throws Exception {
        given(authService.login(any()))
                .willThrow(new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."));

        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        new LoginRequest("master@test.com", "wrong-password"))))
                        .andExpect(status().isUnauthorized())
                        .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("code").asText()).isEqualTo("INVALID_CREDENTIALS");
        assertThat(body.get("requestId").asText()).isNotBlank();
    }

    @Test
    void me_인증없이_호출하면_401을_반환한다() throws Exception {
        given(authService.me(null))
                .willThrow(new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "로그인이 필요합니다."));

        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void me_인증된_상태면_사용자정보를_반환한다() throws Exception {
        AuthUser authUser = new AuthUser(1L, "MASTER", 1L, "master@test.com", "김대표");
        given(authService.me(authUser)).willReturn(LoginResponse.from(authUser));
        String accessToken = jwtTokenProvider.generateAccessToken(authUser);

        MvcResult result =
                mockMvc.perform(get("/api/auth/me").cookie(new Cookie("ACCESS_TOKEN", accessToken)))
                        .andExpect(status().isOk())
                        .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("email").asText()).isEqualTo("master@test.com");
    }
}
