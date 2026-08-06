package com.roma.qurie.report.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI 서버 POST /api/report 응답. comment→ai_comment, strengths→ai_strengths,
 * improvements→ai_improvements 로 리포트 컬럼에 대응한다.
 * skipped_reason 이 차 있으면 LLM 을 부르지 않고 돌려준 경우다(응시 문항 부족 등).
 */
public record AiReportResponse(
		String comment,
		List<AiReportBullet> strengths,
		List<AiReportBullet> improvements,
		@JsonProperty("focus_concepts") List<String> focusConcepts,
		@JsonProperty("skipped_reason") String skippedReason) {

	/**
	 * 강점·보완점 1개. quiz_index 는 요청 attempts[].index 그대로고, cohort_rate 는 그 문항의
	 * 반 정답률(%)이다 — 둘 다 AI 문장이 아니라 서버 데이터에서 채워진 값이라 신뢰할 수 있다.
	 */
	public record AiReportBullet(
			@JsonProperty("quiz_index") Integer quizIndex,
			String text,
			@JsonProperty("cohort_rate") Double cohortRate) {
	}
}
