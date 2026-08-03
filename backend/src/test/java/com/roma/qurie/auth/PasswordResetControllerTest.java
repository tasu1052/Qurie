package com.roma.qurie.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

import com.roma.qurie.auth.dto.PasswordResetConfirmRequest;
import com.roma.qurie.auth.dto.PasswordResetRequest;
import com.roma.qurie.config.SecurityConfig;
import com.roma.qurie.security.JwtTokenProvider;
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
 * SecurityConfig 를 실제 빈으로 띄운다 — 이 컨트롤러의 두 경로가 permitAll 화이트리스트에
 * 실제로 걸려 있는지(쿠키 없이도 401 이 아닌지)를 이 테스트가 검증하는 것이지, 목으로 대체하면
 * 그 검증 자체가 사라진다.
 */
@WebMvcTest(PasswordResetController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class})
@TestPropertySource(properties = "jwt.secret=test-only-secret-key-must-be-at-least-32-bytes-long!!")
class PasswordResetControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private PasswordResetService passwordResetService;

	@Test
	void request_인증_쿠키_없이도_요청을_받아_204를_반환한다() throws Exception {
		mockMvc.perform(post("/api/auth/password-reset")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new PasswordResetRequest("student@test.com"))))
				.andExpect(status().isNoContent());

		verify(passwordResetService).requestReset("student@test.com");
	}

	@Test
	void request_이메일_형식이_아니면_400을_반환한다() throws Exception {
		mockMvc.perform(post("/api/auth/password-reset")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new PasswordResetRequest("not-an-email"))))
				.andExpect(status().isBadRequest());

		verify(passwordResetService, never()).requestReset(any());
	}

	@Test
	void confirm_유효한_토큰이면_204를_반환한다() throws Exception {
		mockMvc.perform(post("/api/auth/password-reset/confirm")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								new PasswordResetConfirmRequest("raw-token", "new-password123"))))
				.andExpect(status().isNoContent());

		verify(passwordResetService).confirmReset("raw-token", "new-password123");
	}

	@Test
	void confirm_토큰이_유효하지_않으면_에러포맷으로_400을_반환한다() throws Exception {
		doThrow(new AuthException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "유효하지 않거나 만료된 요청입니다."))
				.when(passwordResetService).confirmReset("bad-token", "new-password123");

		MvcResult result = mockMvc.perform(post("/api/auth/password-reset/confirm")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								new PasswordResetConfirmRequest("bad-token", "new-password123"))))
				.andExpect(status().isBadRequest())
				.andReturn();

		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(body.get("code").asText()).isEqualTo("INVALID_RESET_TOKEN");
	}

	@Test
	void confirm_새_비밀번호가_너무_짧으면_400을_반환한다() throws Exception {
		mockMvc.perform(post("/api/auth/password-reset/confirm")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								new PasswordResetConfirmRequest("raw-token", "short"))))
				.andExpect(status().isBadRequest());

		verify(passwordResetService, never()).confirmReset(any(), any());
	}
}
