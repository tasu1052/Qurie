package com.roma.qurie.report.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI 서버 POST /api/report 요청 본문. ai_service 의 CreateReportRequest(pydantic)와 1:1 이며
 * snake_case 라 @JsonProperty 로 못박는다.
 *
 * null 필드는 직렬화에서 뺀다(NON_NULL) — pydantic 은 "필드 없음"엔 기본값을 쓰지만
 * 명시적 null 은 타입에 따라 422 로 거절한다(tested_concept: str 등).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiReportCreateRequest(
		@JsonProperty("student_name") String studentName,
		@JsonProperty("session_id") Long sessionId,
		@JsonProperty("quiz_set_id") Long quizSetId,
		AiReportSummary summary,
		List<AiReportAttempt> attempts) {
}
