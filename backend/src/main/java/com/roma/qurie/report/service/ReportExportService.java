package com.roma.qurie.report.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.entity.UserReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 발급된 리포트를 다운로드용 PDF 문서로 만든다.
 *
 * 리포트 화면은 프론트가 그리지만, 학생에게 전달·보관되는 산출물은 서버가 생성해야
 * 누가 언제 내려받아도 같은 문서가 나온다. 템플릿 엔진 없이 XHTML 을 직접 조립한다 —
 * PDF 변환기(openhtmltopdf)가 잘 갖춘 XML 만 받으므로 모든 동적 값은 이스케이프한다.
 */
@Service
@RequiredArgsConstructor
public class ReportExportService {

	private static final DateTimeFormatter ISSUED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

	private static final String STYLE = """
			@page { size: A4; margin: 20mm; }
			body { font-family: 'NanumGothic'; font-size: 11px; color: #24292f; }
			h1 { font-size: 20px; margin: 0 0 4px 0; }
			h2 { font-size: 13px; margin: 24px 0 8px 0; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; }
			h3 { font-size: 11px; margin: 12px 0 4px 0; }
			p { margin: 6px 0; }
			ul { margin: 4px 0 8px 18px; padding: 0; }
			.meta { color: #57606a; margin-bottom: 16px; }
			table { width: 100%; border-collapse: collapse; }
			th, td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; }
			th { background-color: #f6f8fa; width: 35%; }
			.footer { margin-top: 28px; color: #8b949e; font-size: 9px; text-align: right; }
			""";

	private final UserReportRepository userReportRepository;
	private final SessionReportRepository sessionReportRepository;
	private final UserRepository userRepository;
	private final ReportPdfRenderer pdfRenderer;

	@Transactional(readOnly = true)
	public byte[] exportUserReportPdf(Long ordinaryUserId, Long classId) {
		UserReport report = userReportRepository.findByOrdinaryUserIdAndClassId(ordinaryUserId, classId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 최종 리포트가 없습니다."));

		return pdfRenderer.render(buildUserReportHtml(report, userNameOf(ordinaryUserId)));
	}

	@Transactional(readOnly = true)
	public byte[] exportSessionReportPdf(Long sessionId, Long ordinaryUserId) {
		SessionReport report = sessionReportRepository.findBySessionIdAndOrdinaryUserId(sessionId, ordinaryUserId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 세션 리포트가 없습니다."));

		return pdfRenderer.render(buildSessionReportHtml(report, userNameOf(ordinaryUserId)));
	}

	private String userNameOf(Long ordinaryUserId) {
		return userRepository.findById(ordinaryUserId)
				.map(User::getName)
				.orElse("(탈퇴한 사용자)");
	}

	private String buildUserReportHtml(UserReport report, String userName) {
		StringBuilder html = new StringBuilder();
		html.append("<html><head><style>").append(STYLE).append("</style></head><body>");
		html.append("<h1>학습 최종 리포트</h1>");
		html.append("<div class=\"meta\">").append(escape(userName))
				.append(" · 클래스 ").append(report.getClassId())
				.append(" · 발급일 ").append(formatDateTime(report.getIssuedAt())).append("</div>");

		html.append("<h2>학습 요약</h2><table>");
		appendRow(html, "참여 세션 수", String.valueOf(report.getSessionCount()));
		appendRow(html, "이수율", formatPercent(report.getCompletionRate()));
		appendRow(html, "정답률", formatPercent(report.getAccuracy()));
		appendRow(html, "평균 풀이 시간", formatElapsed(report.getAvgElapsedMs()));
		appendRow(html, "평점", formatRating(report.getRating(), report.getRatingFormulaVersion()));
		html.append("</table>");

		appendQuizCounts(html, report.getQuizTotalCount(), report.getQuizAttemptedCount(),
				report.getQuizCorrectCount(), report.getQuizSkippedCount());
		appendMapSection(html, "난이도별 분포", report.getDifficultyRatio());
		appendMapSection(html, "개념별 통계", report.getConceptStats());

		appendFooter(html, "user report #" + report.getId());
		html.append("</body></html>");
		return html.toString();
	}

	private String buildSessionReportHtml(SessionReport report, String userName) {
		StringBuilder html = new StringBuilder();
		html.append("<html><head><style>").append(STYLE).append("</style></head><body>");
		html.append("<h1>세션 리포트</h1>");
		html.append("<div class=\"meta\">").append(escape(userName))
				.append(" · 세션 ").append(report.getSessionId())
				.append(" · 발급일 ").append(formatDateTime(report.getIssuedAt())).append("</div>");

		html.append("<h2>학습 요약</h2><table>");
		appendRow(html, "이수율", formatPercent(report.getCompletionRate()));
		appendRow(html, "정답률", formatPercent(report.getAccuracy()));
		appendRow(html, "평균 풀이 시간", formatElapsed(report.getAvgElapsedMs()));
		appendRow(html, "퀴즈 평점", formatRating(report.getQuizRating(), null));
		html.append("</table>");

		appendQuizCounts(html, report.getQuizTotalCount(), report.getQuizAttemptedCount(),
				report.getQuizCorrectCount(), report.getQuizSkippedCount());
		appendMapSection(html, "난이도별 분포", report.getDifficultyRatio());
		appendMapSection(html, "개념별 통계", report.getConceptStats());
		appendAiFeedback(html, report);
		appendManagerComment(html, report);

		appendFooter(html, "session report #" + report.getId());
		html.append("</body></html>");
		return html.toString();
	}

	private void appendQuizCounts(StringBuilder html, int total, int attempted, int correct, int skipped) {
		html.append("<h2>퀴즈 현황</h2><table>");
		appendRow(html, "전체 문제 수", String.valueOf(total));
		appendRow(html, "응시", String.valueOf(attempted));
		appendRow(html, "정답", String.valueOf(correct));
		appendRow(html, "건너뜀", String.valueOf(skipped));
		html.append("</table>");
	}

	private void appendAiFeedback(StringBuilder html, SessionReport report) {
		boolean hasComment = report.getAiComment() != null && !report.getAiComment().isBlank();
		boolean hasLists = hasItems(report.getAiStrengths()) || hasItems(report.getAiImprovements());
		if (!hasComment && !hasLists) {
			return;
		}
		html.append("<h2>AI 피드백</h2>");
		if (hasComment) {
			html.append("<p>").append(escape(report.getAiComment())).append("</p>");
		}
		appendListSection(html, "강점", report.getAiStrengths());
		appendListSection(html, "보완점", report.getAiImprovements());
	}

	private void appendManagerComment(StringBuilder html, SessionReport report) {
		if (report.getManagerComment() == null || report.getManagerComment().isBlank()) {
			return;
		}
		html.append("<h2>매니저 코멘트</h2>");
		html.append("<p>").append(escape(report.getManagerComment())).append("</p>");
	}

	private void appendListSection(StringBuilder html, String title, List<String> items) {
		if (!hasItems(items)) {
			return;
		}
		html.append("<h3>").append(escape(title)).append("</h3><ul>");
		for (String item : items) {
			html.append("<li>").append(escape(String.valueOf(item))).append("</li>");
		}
		html.append("</ul>");
	}

	private boolean hasItems(List<String> items) {
		return items != null && !items.isEmpty();
	}

	private void appendRow(StringBuilder html, String label, String value) {
		html.append("<tr><th>").append(escape(label)).append("</th><td>").append(escape(value)).append("</td></tr>");
	}

	/** JSON 컬럼은 구조가 확정되지 않아(Planning 초안) 키-값 표로 일반 렌더링한다. 키 순서는 정렬로 고정한다. */
	private void appendMapSection(StringBuilder html, String title, Map<String, Object> values) {
		if (values == null || values.isEmpty()) {
			return;
		}
		html.append("<h2>").append(escape(title)).append("</h2><table>");
		for (Map.Entry<String, Object> entry : new TreeMap<>(values).entrySet()) {
			appendRow(html, entry.getKey(), String.valueOf(entry.getValue()));
		}
		html.append("</table>");
	}

	private void appendFooter(StringBuilder html, String reference) {
		html.append("<div class=\"footer\">Qurie · ").append(escape(reference)).append("</div>");
	}

	private String formatDateTime(LocalDateTime dateTime) {
		if (dateTime == null) {
			return "-";
		}
		return dateTime.format(ISSUED_AT_FORMAT);
	}

	private String formatPercent(BigDecimal value) {
		if (value == null) {
			return "-";
		}
		return value.stripTrailingZeros().toPlainString() + "%";
	}

	private String formatElapsed(Integer elapsedMs) {
		if (elapsedMs == null) {
			return "-";
		}
		return String.format("%.1f초", elapsedMs / 1000.0);
	}

	private String formatRating(BigDecimal rating, String formulaVersion) {
		if (rating == null) {
			return "-";
		}
		String value = rating.stripTrailingZeros().toPlainString();
		if (formulaVersion == null) {
			return value;
		}
		return value + " (기준 " + formulaVersion + ")";
	}

	private String escape(String value) {
		return HtmlUtils.htmlEscape(value);
	}
}
