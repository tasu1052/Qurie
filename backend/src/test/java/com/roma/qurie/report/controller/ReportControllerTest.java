package com.roma.qurie.report.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roma.qurie.config.SecurityConfig;
import com.roma.qurie.report.service.ReportExportService;
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
import org.springframework.web.server.ResponseStatusException;

/**
 * SessionControllerTest 와 같은 이유로 SecurityConfig/JwtTokenProvider 를 실제 빈으로 띄운다 —
 * anyRequest().authenticated() 가 기본이라 다운로드 요청도 ACCESS_TOKEN 쿠키가 실제 필터 체인을 타야 한다.
 */
@WebMvcTest(ReportController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class})
@TestPropertySource(properties = "jwt.secret=test-only-secret-key-must-be-at-least-32-bytes-long!!")
class ReportControllerTest {

	private static final Long USER_ID = 7L;
	private static final Long CLASS_ID = 3L;
	private static final Long SESSION_ID = 11L;

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtTokenProvider jwtTokenProvider;

	@MockitoBean
	private ReportExportService reportExportService;

	@Test
	void 사용자_리포트를_PDF_파일로_내려준다() throws Exception {
		byte[] pdf = "%PDF-1.6 fake".getBytes();
		given(reportExportService.exportUserReportPdf(eq(USER_ID), eq(CLASS_ID), any(AuthUser.class))).willReturn(pdf);

		mockMvc.perform(get("/api/reports/users/{userId}/export", USER_ID)
						.param("classId", String.valueOf(CLASS_ID))
						.cookie(accessTokenCookie()))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.APPLICATION_PDF))
				.andExpect(header().string("Content-Disposition",
						"attachment; filename=\"user-report-7-class-3.pdf\""))
				.andExpect(content().bytes(pdf));
	}

	@Test
	void 발급된_리포트가_없으면_404를_반환한다() throws Exception {
		given(reportExportService.exportUserReportPdf(eq(USER_ID), eq(CLASS_ID), any(AuthUser.class)))
				.willThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 최종 리포트가 없습니다."));

		mockMvc.perform(get("/api/reports/users/{userId}/export", USER_ID)
						.param("classId", String.valueOf(CLASS_ID))
						.cookie(accessTokenCookie()))
				.andExpect(status().isNotFound());
	}

	@Test
	void classId_없이_호출하면_400을_반환한다() throws Exception {
		mockMvc.perform(get("/api/reports/users/{userId}/export", USER_ID).cookie(accessTokenCookie()))
				.andExpect(status().isBadRequest());
	}

	@Test
	void 세션_리포트를_PDF_파일로_내려준다() throws Exception {
		byte[] pdf = "%PDF-1.6 fake".getBytes();
		given(reportExportService.exportSessionReportPdf(eq(SESSION_ID), eq(USER_ID), any(AuthUser.class))).willReturn(pdf);

		mockMvc.perform(get("/api/reports/sessions/{sessionId}/export", SESSION_ID)
						.param("userId", String.valueOf(USER_ID))
						.cookie(accessTokenCookie()))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.APPLICATION_PDF))
				.andExpect(header().string("Content-Disposition",
						"attachment; filename=\"session-report-11-user-7.pdf\""))
				.andExpect(content().bytes(pdf));
	}

	@Test
	void 발급된_세션_리포트가_없으면_404를_반환한다() throws Exception {
		given(reportExportService.exportSessionReportPdf(eq(SESSION_ID), eq(USER_ID), any(AuthUser.class)))
				.willThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 세션 리포트가 없습니다."));

		mockMvc.perform(get("/api/reports/sessions/{sessionId}/export", SESSION_ID)
						.param("userId", String.valueOf(USER_ID))
						.cookie(accessTokenCookie()))
				.andExpect(status().isNotFound());
	}

	@Test
	void 인증_쿠키가_없으면_401을_반환한다() throws Exception {
		mockMvc.perform(get("/api/reports/users/{userId}/export", USER_ID)
						.param("classId", String.valueOf(CLASS_ID)))
				.andExpect(status().isUnauthorized());
	}

	private Cookie accessTokenCookie() {
		AuthUser authUser = new AuthUser(USER_ID, "STUDENT", 1L, "student@qurie.com", "학생", CLASS_ID);
		return new Cookie("ACCESS_TOKEN", jwtTokenProvider.generateAccessToken(authUser));
	}
}
