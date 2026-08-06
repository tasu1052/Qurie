package com.roma.qurie.report.ai;

import java.math.BigDecimal;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 서버가 quiz_progress 에서 이미 집계한 정량 지표. 리포트 엔티티에 저장하는 값과 같은 모양이다 —
 * AI 는 이 숫자를 다시 계산하지 않고 사실로 받아 해석만 한다(산술을 맡기면 화면 통계와 어긋난다).
 * difficulty_ratio·concept_stats 값은 {total, attempted, correct} 개수 맵이어야 한다(AI 쪽 ConceptCount).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiReportSummary(
		@JsonProperty("quiz_total_count") int quizTotalCount,
		@JsonProperty("quiz_attempted_count") int quizAttemptedCount,
		@JsonProperty("quiz_correct_count") int quizCorrectCount,
		@JsonProperty("quiz_skipped_count") int quizSkippedCount,
		BigDecimal accuracy,
		@JsonProperty("completion_rate") BigDecimal completionRate,
		@JsonProperty("avg_elapsed_ms") Integer avgElapsedMs,
		@JsonProperty("difficulty_ratio") Map<String, Object> difficultyRatio,
		@JsonProperty("concept_stats") Map<String, Object> conceptStats) {
}
