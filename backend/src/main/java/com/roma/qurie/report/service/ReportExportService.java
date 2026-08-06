package com.roma.qurie.report.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
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
import com.roma.qurie.security.AuthUser;
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

	private static final List<String> DIFFICULTY_ORDER = List.of("EASY", "NORMAL", "HARD");
	private static final Map<String, String> DIFFICULTY_LABELS =
			Map.of("EASY", "쉬움", "NORMAL", "보통", "HARD", "어려움");

	/** 강조색은 서비스 화면의 보라 계열 액센트를 따른다. openhtmltopdf 는 CSS 2.1 수준만 지원한다. */
	private static final String STYLE = """
			@page { size: A4; margin: 18mm 16mm; }
			body { font-family: 'NanumGothic'; font-size: 10.5px; color: #23272f; line-height: 1.6; }
			.brand { font-size: 10px; font-weight: bold; letter-spacing: 3px; color: #6c5ce7; margin-bottom: 4px; }
			h1 { font-size: 22px; margin: 0 0 6px 0; color: #16181d; }
			.meta { color: #6b7280; margin-bottom: 14px; }
			.rule { border-bottom: 2px solid #6c5ce7; margin-bottom: 6px; }
			h2 { font-size: 12.5px; margin: 22px 0 8px 0; padding-left: 8px; border-left: 3px solid #6c5ce7; color: #16181d; }
			h3 { font-size: 11px; margin: 12px 0 4px 0; color: #374151; }
			h3.strength { color: #0f766e; }
			h3.improvement { color: #b45309; }
			table { width: 100%; border-collapse: collapse; }
			th, td { border: 1px solid #e5e7eb; padding: 7px 9px; text-align: left; }
			th { background-color: #f4f4fb; color: #4b5563; }
			th.num, td.num { text-align: right; }
			table.stats td { text-align: center; padding: 10px 6px; }
			.stat-value { font-size: 15px; font-weight: bold; color: #16181d; }
			.stat-label { font-size: 9.5px; color: #6b7280; margin-top: 2px; }
			.ai-comment { background-color: #f7f6fe; border: 1px solid #e4defc; padding: 11px 13px; margin: 6px 0 10px 0; }
			ul { margin: 2px 0 10px 16px; padding: 0; }
			li { margin: 3px 0; }
			.manager-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 13px; }
			.footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 8px; color: #9ca3af; font-size: 9px; text-align: right; }
			""";

	private final UserReportRepository userReportRepository;
	private final SessionReportRepository sessionReportRepository;
	private final UserRepository userRepository;
	private final ReportPdfRenderer pdfRenderer;

	@Transactional(readOnly = true)
	public byte[] exportUserReportPdf(Long ordinaryUserId, Long classId, AuthUser requester) {
		verifyCanExport(ordinaryUserId, requester);
		UserReport report = userReportRepository.findByOrdinaryUserIdAndClassId(ordinaryUserId, classId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 최종 리포트가 없습니다."));

		return pdfRenderer.render(buildUserReportHtml(report, userNameOf(ordinaryUserId)));
	}

	@Transactional(readOnly = true)
	public byte[] exportSessionReportPdf(Long sessionId, Long ordinaryUserId, AuthUser requester) {
		verifyCanExport(ordinaryUserId, requester);
		SessionReport report = sessionReportRepository.findBySessionIdAndOrdinaryUserId(sessionId, ordinaryUserId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 세션 리포트가 없습니다."));

		return pdfRenderer.render(buildSessionReportHtml(report, userNameOf(ordinaryUserId)));
	}

	/** 다운로드는 조회와 같은 권한 기준(본인/매니저/마스터)을 쓴다 — PDF 라고 화면 조회보다 느슨하면 우회 경로가 된다. */
	private void verifyCanExport(Long ordinaryUserId, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (!ReportAccessPolicy.canView(requester, ordinaryUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 리포트를 내려받을 권한이 없습니다.");
		}
	}

	private String userNameOf(Long ordinaryUserId) {
		return userRepository.findById(ordinaryUserId)
				.map(User::getName)
				.orElse("(탈퇴한 사용자)");
	}

	private String buildUserReportHtml(UserReport report, String userName) {
		StringBuilder html = new StringBuilder();
		html.append("<html><head><style>").append(STYLE).append("</style></head><body>");
		appendHeader(html, "학습 최종 리포트",
				userName + " · 클래스 " + report.getClassId() + " · 발급일 " + formatDateTime(report.getIssuedAt()));

		html.append("<h2>학습 요약</h2>");
		appendStatBand(html, new String[][] {
				{String.valueOf(report.getSessionCount()), "참여 세션"},
				{formatPercent(report.getCompletionRate()), "이수율"},
				{formatPercent(report.getAccuracy()), "정답률"},
				{formatElapsed(report.getAvgElapsedMs()), "평균 풀이 시간"},
		});

		appendQuizCounts(html, report.getQuizTotalCount(), report.getQuizAttemptedCount(),
				report.getQuizCorrectCount(), report.getQuizSkippedCount());
		appendStatsSection(html, "난이도별 분포", report.getDifficultyRatio(), true);
		appendStatsSection(html, "개념별 통계", report.getConceptStats(), false);
		appendAiFeedback(html, report.getAiComment(), report.getAiStrengths(), report.getAiImprovements());

		appendFooter(html, "user report #" + report.getId());
		html.append("</body></html>");
		return html.toString();
	}

	private String buildSessionReportHtml(SessionReport report, String userName) {
		StringBuilder html = new StringBuilder();
		html.append("<html><head><style>").append(STYLE).append("</style></head><body>");
		appendHeader(html, "세션 리포트",
				userName + " · 세션 " + report.getSessionId() + " · 발급일 " + formatDateTime(report.getIssuedAt()));

		html.append("<h2>학습 요약</h2>");
		appendStatBand(html, new String[][] {
				{formatPercent(report.getCompletionRate()), "이수율"},
				{formatPercent(report.getAccuracy()), "정답률"},
				{formatElapsed(report.getAvgElapsedMs()), "평균 풀이 시간"},
				{report.getQuizAttemptedCount() + " / " + report.getQuizTotalCount(), "응시 문항"},
		});

		appendQuizCounts(html, report.getQuizTotalCount(), report.getQuizAttemptedCount(),
				report.getQuizCorrectCount(), report.getQuizSkippedCount());
		appendStatsSection(html, "난이도별 분포", report.getDifficultyRatio(), true);
		appendStatsSection(html, "개념별 통계", report.getConceptStats(), false);
		appendAiFeedback(html, report.getAiComment(), report.getAiStrengths(), report.getAiImprovements());
		appendManagerComment(html, report);

		appendFooter(html, "session report #" + report.getId());
		html.append("</body></html>");
		return html.toString();
	}

	private void appendHeader(StringBuilder html, String documentTitle, String meta) {
		html.append("<div class=\"brand\">QURIE</div>");
		html.append("<h1>").append(escape(documentTitle)).append("</h1>");
		html.append("<div class=\"meta\">").append(escape(meta)).append("</div>");
		html.append("<div class=\"rule\"></div>");
	}

	/** 핵심 지표를 카드처럼 한 줄로 보여준다. openhtmltopdf 에는 flex 가 없어 표 한 행으로 만든다. */
	private void appendStatBand(StringBuilder html, String[][] stats) {
		html.append("<table class=\"stats\"><tr>");
		for (String[] stat : stats) {
			html.append("<td><div class=\"stat-value\">").append(escape(stat[0]))
					.append("</div><div class=\"stat-label\">").append(escape(stat[1])).append("</div></td>");
		}
		html.append("</tr></table>");
	}

	private void appendQuizCounts(StringBuilder html, int total, int attempted, int correct, int skipped) {
		html.append("<h2>퀴즈 현황</h2><table>");
		html.append("<tr><th class=\"num\">전체 문항</th><th class=\"num\">응시</th>")
				.append("<th class=\"num\">정답</th><th class=\"num\">건너뜀</th></tr>");
		html.append("<tr>");
		for (int value : new int[] {total, attempted, correct, skipped}) {
			html.append("<td class=\"num\">").append(value).append("</td>");
		}
		html.append("</tr></table>");
	}

	/**
	 * 난이도·개념 통계 표. 값이 {total, attempted, correct} 개수 맵이면 열로 펼쳐 정답률까지 보여주고,
	 * 그 모양이 아니면(과거 데이터) 키-값 표로 일반 렌더링한다.
	 */
	private void appendStatsSection(StringBuilder html, String title, Map<String, Object> values, boolean difficulty) {
		if (values == null || values.isEmpty()) {
			return;
		}
		html.append("<h2>").append(escape(title)).append("</h2><table>");
		boolean allCounts = values.values().stream().allMatch(value -> value instanceof Map);
		if (!allCounts) {
			for (Map.Entry<String, Object> entry : new TreeMap<>(values).entrySet()) {
				appendRow(html, entry.getKey(), String.valueOf(entry.getValue()));
			}
			html.append("</table>");
			return;
		}
		html.append("<tr><th>항목</th><th class=\"num\">전체</th><th class=\"num\">응시</th>")
				.append("<th class=\"num\">정답</th><th class=\"num\">정답률</th></tr>");
		for (Map.Entry<String, Object> entry : ordered(values, difficulty).entrySet()) {
			Map<?, ?> counts = (Map<?, ?>) entry.getValue();
			int total = intOf(counts.get("total"));
			int attempted = intOf(counts.get("attempted"));
			int correct = intOf(counts.get("correct"));
			String label = difficulty
					? DIFFICULTY_LABELS.getOrDefault(entry.getKey(), entry.getKey())
					: entry.getKey();
			html.append("<tr><td>").append(escape(label)).append("</td>")
					.append("<td class=\"num\">").append(total).append("</td>")
					.append("<td class=\"num\">").append(attempted).append("</td>")
					.append("<td class=\"num\">").append(correct).append("</td>")
					.append("<td class=\"num\">").append(escape(rateOf(correct, attempted))).append("</td></tr>");
		}
		html.append("</table>");
	}

	/** 난이도는 사전순(EASY,HARD,NORMAL)이 아니라 쉬움→어려움 순으로, 나머지 키는 정렬로 고정한다. */
	private Map<String, Object> ordered(Map<String, Object> values, boolean difficulty) {
		if (!difficulty) {
			return new TreeMap<>(values);
		}
		Map<String, Object> result = new LinkedHashMap<>();
		for (String key : DIFFICULTY_ORDER) {
			if (values.containsKey(key)) {
				result.put(key, values.get(key));
			}
		}
		for (Map.Entry<String, Object> entry : new TreeMap<>(values).entrySet()) {
			result.putIfAbsent(entry.getKey(), entry.getValue());
		}
		return result;
	}

	private void appendAiFeedback(StringBuilder html, String comment, List<String> strengths,
			List<String> improvements) {
		boolean hasComment = comment != null && !comment.isBlank();
		boolean hasLists = hasItems(strengths) || hasItems(improvements);
		if (!hasComment && !hasLists) {
			return;
		}
		html.append("<h2>AI 피드백</h2>");
		if (hasComment) {
			html.append("<div class=\"ai-comment\">").append(escape(comment)).append("</div>");
		}
		appendListSection(html, "강점", "strength", strengths);
		appendListSection(html, "보완점", "improvement", improvements);
	}

	private void appendManagerComment(StringBuilder html, SessionReport report) {
		if (report.getManagerComment() == null || report.getManagerComment().isBlank()) {
			return;
		}
		html.append("<h2>매니저 코멘트</h2>");
		html.append("<div class=\"manager-box\">").append(escape(report.getManagerComment())).append("</div>");
	}

	private void appendListSection(StringBuilder html, String title, String tone, List<String> items) {
		if (!hasItems(items)) {
			return;
		}
		html.append("<h3 class=\"").append(tone).append("\">").append(escape(title)).append("</h3><ul>");
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

	private String rateOf(int correct, int attempted) {
		if (attempted == 0) {
			return "-";
		}
		return Math.round(correct * 100.0 / attempted) + "%";
	}

	/** JSON 컬럼의 숫자는 역직렬화 방식에 따라 Integer/Long 으로 올 수 있어 Number 로 받는다. */
	private int intOf(Object value) {
		return value instanceof Number number ? number.intValue() : 0;
	}

	/**
	 * 기본 htmlEscape(인코딩 미지정)는 ISO-8859-1 밖의 활자 기호(둥근따옴표 등)를 &lsquo; 같은
	 * HTML 전용 명명 엔티티로 바꾸는데, PDF 변환기의 XML 파서는 그 엔티티 선언을 몰라 문서 전체를
	 * 거부한다(AI 문장이 담긴 리포트가 500 났던 원인). UTF-8 기준으로 XML 이 아는 기본 엔티티만 남긴다.
	 */
	private String escape(String value) {
		return HtmlUtils.htmlEscape(value, StandardCharsets.UTF_8.name());
	}
}
