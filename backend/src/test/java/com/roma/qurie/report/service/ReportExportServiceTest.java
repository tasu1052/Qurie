package com.roma.qurie.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.entity.UserReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ReportExportServiceTest {

	private static final Long USER_ID = 7L;
	private static final Long CLASS_ID = 3L;
	private static final Long SESSION_ID = 11L;
	private static final AuthUser SELF =
			new AuthUser(USER_ID, "STUDENT", 100L, "student@qurie.com", "학생", CLASS_ID);
	private static final AuthUser OTHER_STUDENT =
			new AuthUser(20L, "STUDENT", 100L, "other@qurie.com", "다른 학생", CLASS_ID);

	@Mock
	private UserReportRepository userReportRepository;

	@Mock
	private SessionReportRepository sessionReportRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private ReportPdfRenderer pdfRenderer;

	@InjectMocks
	private ReportExportService reportExportService;

	@Test
	void 리포트_수치가_XHTML_로_렌더러에_전달된다() {
		given(userReportRepository.findByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID))
				.willReturn(Optional.of(userReport()));
		given(userRepository.findById(USER_ID)).willReturn(Optional.empty());
		given(pdfRenderer.render(anyString())).willReturn("%PDF-fake".getBytes());

		byte[] pdf = reportExportService.exportUserReportPdf(USER_ID, CLASS_ID, SELF);

		assertThat(pdf).isEqualTo("%PDF-fake".getBytes());
		ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
		verify(pdfRenderer).render(captor.capture());
		String html = captor.getValue();
		assertThat(html).contains("학습 최종 리포트");
		assertThat(html).contains("(탈퇴한 사용자)");
		assertThat(html).contains("87.5%");
		assertThat(html).contains("2026-08-01 10:30");
		assertThat(html).contains("EASY");
	}

	@Test
	void JSON_통계의_특수문자는_이스케이프되어_XML_이_깨지지_않는다() {
		given(userReportRepository.findByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID))
				.willReturn(Optional.of(UserReport.builder()
						.ordinaryUserId(USER_ID)
						.classId(CLASS_ID)
						.conceptStats(Map.of("<script>", "a & b"))
						.build()));
		given(userRepository.findById(USER_ID)).willReturn(Optional.empty());
		given(pdfRenderer.render(anyString())).willReturn(new byte[0]);

		reportExportService.exportUserReportPdf(USER_ID, CLASS_ID, SELF);

		ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
		verify(pdfRenderer).render(captor.capture());
		assertThat(captor.getValue()).contains("&lt;script&gt;");
		assertThat(captor.getValue()).contains("a &amp; b");
		assertThat(captor.getValue()).doesNotContain("<script>");
	}

	@Test
	void 발급된_리포트가_없으면_404_예외를_던진다() {
		given(userReportRepository.findByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID))
				.willReturn(Optional.empty());

		assertThatThrownBy(() -> reportExportService.exportUserReportPdf(USER_ID, CLASS_ID, SELF))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void 세션_리포트의_AI_피드백과_매니저_코멘트가_렌더러에_전달된다() {
		given(sessionReportRepository.findBySessionIdAndOrdinaryUserId(SESSION_ID, USER_ID))
				.willReturn(Optional.of(sessionReport()));
		given(userRepository.findById(USER_ID)).willReturn(Optional.empty());
		given(pdfRenderer.render(anyString())).willReturn("%PDF-fake".getBytes());

		byte[] pdf = reportExportService.exportSessionReportPdf(SESSION_ID, USER_ID, SELF);

		assertThat(pdf).isEqualTo("%PDF-fake".getBytes());
		ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
		verify(pdfRenderer).render(captor.capture());
		String html = captor.getValue();
		assertThat(html).contains("세션 리포트");
		assertThat(html).contains("AI 피드백");
		assertThat(html).contains("기초가 탄탄합니다");
		assertThat(html).contains("트랜잭션 이해");
		assertThat(html).contains("N+1 문제");
	}

	@Test
	void 발급된_세션_리포트가_없으면_404_예외를_던진다() {
		given(sessionReportRepository.findBySessionIdAndOrdinaryUserId(SESSION_ID, USER_ID))
				.willReturn(Optional.empty());

		assertThatThrownBy(() -> reportExportService.exportSessionReportPdf(SESSION_ID, USER_ID, SELF))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void 다른_학생의_리포트를_내려받으면_403_예외를_던진다() {
		assertThatThrownBy(() -> reportExportService.exportUserReportPdf(USER_ID, CLASS_ID, OTHER_STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void 로그인하지_않으면_401_예외를_던진다() {
		assertThatThrownBy(() -> reportExportService.exportSessionReportPdf(SESSION_ID, USER_ID, null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	private SessionReport sessionReport() {
		return SessionReport.builder()
				.sessionId(SESSION_ID)
				.ordinaryUserId(USER_ID)
				.quizSetId(1L)
				.quizTotalCount(10)
				.quizAttemptedCount(9)
				.quizCorrectCount(7)
				.quizSkippedCount(1)
				.completionRate(new BigDecimal("90.00"))
				.accuracy(new BigDecimal("77.78"))
				.avgElapsedMs(8_000)
				.quizRating(new BigDecimal("4.0"))
				.aiComment("기초가 탄탄합니다.")
				.aiStrengths(List.of("트랜잭션 이해"))
				.aiImprovements(List.of("N+1 문제"))
				.issuedAt(LocalDateTime.of(2026, 8, 2, 15, 0))
				.build();
	}

	private UserReport userReport() {
		return UserReport.builder()
				.ordinaryUserId(USER_ID)
				.classId(CLASS_ID)
				.sessionCount(12)
				.quizTotalCount(40)
				.quizAttemptedCount(38)
				.quizCorrectCount(30)
				.quizSkippedCount(2)
				.completionRate(new BigDecimal("87.50"))
				.accuracy(new BigDecimal("78.90"))
				.avgElapsedMs(12_300)
				.difficultyRatio(Map.of("EASY", 0.5, "HARD", 0.2))
				.conceptStats(Map.of("JPA", Map.of("correct", 5)))
				.rating(new BigDecimal("4.5"))
				.ratingFormulaVersion("v0.1")
				.issuedAt(LocalDateTime.of(2026, 8, 1, 10, 30))
				.build();
	}
}
