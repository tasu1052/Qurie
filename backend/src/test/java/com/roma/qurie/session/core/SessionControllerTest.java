package com.roma.qurie.session.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roma.qurie.config.SecurityConfig;
import com.roma.qurie.report.service.SessionReportService;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.security.JwtTokenProvider;
import com.roma.qurie.session.participant.SessionParticipantService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

/**
 * collab(Yjs) 서버가 위임 호출하는 방 입장 자격 확인 경로 검증.
 * AuthControllerTest 와 같은 이유로 SecurityConfig/JwtTokenProvider 를 실제 빈으로 띄운다 —
 * ACCESS_TOKEN 쿠키 → @AuthenticationPrincipal 해석이 실제 필터 체인을 타야 한다.
 */
@WebMvcTest(SessionController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class})
@TestPropertySource(properties = "jwt.secret=test-only-secret-key-must-be-at-least-32-bytes-long!!")
class SessionControllerTest {

	private static final Long SESSION_ID = 5L;

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@MockitoBean
	private SessionService sessionService;

	@MockitoBean
	private SessionParticipantService sessionParticipantService;

	@MockitoBean
	private SessionReportService sessionReportService;

	@Test
	void 자격_확인을_통과하면_204를_반환한다() throws Exception {
		mockMvc.perform(get("/api/sessions/{id}/access", SESSION_ID).cookie(accessTokenCookie()))
				.andExpect(status().isNoContent());

		ArgumentCaptor<AuthUser> captor = ArgumentCaptor.forClass(AuthUser.class);
		verify(sessionParticipantService).verifyCanEnter(eq(SESSION_ID), captor.capture());
		assertThat(captor.getValue().id()).isEqualTo(7L);
	}

	@Test
	void 반_명단에_없으면_403을_반환한다() throws Exception {
		given(sessionParticipantService.verifyCanEnter(anyLong(), any(AuthUser.class)))
				.willThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 반 소속이 아닙니다."));

		mockMvc.perform(get("/api/sessions/{id}/access", SESSION_ID).cookie(accessTokenCookie()))
				.andExpect(status().isForbidden());
	}

	@Test
	void 인증_쿠키가_없으면_401을_반환한다() throws Exception {
		given(sessionParticipantService.verifyCanEnter(anyLong(), isNull(AuthUser.class)))
				.willThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));

		mockMvc.perform(get("/api/sessions/{id}/access", SESSION_ID))
				.andExpect(status().isUnauthorized());
	}

	private Cookie accessTokenCookie() {
		AuthUser authUser = new AuthUser(7L, "STUDENT", 1L, "student@qurie.com", "학생", 3L);
		return new Cookie("ACCESS_TOKEN", jwtTokenProvider.generateAccessToken(authUser));
	}
}
