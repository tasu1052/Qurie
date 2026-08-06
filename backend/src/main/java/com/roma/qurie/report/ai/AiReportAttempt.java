package com.roma.qurie.report.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 문항 1개의 응시 기록(AI 쪽 Attempt). index 는 요청 안에서 부여한 표시용 문항 번호(1부터)로,
 * 응답 bullet 의 quiz_index 가 이 값을 그대로 되돌려준다.
 * 미응시 문항도 chosen_index=null 로 실어 AI 가 "안 푼 문항"까지 볼 수 있게 한다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiReportAttempt(
		int index,
		String question,
		List<String> choices,
		@JsonProperty("answer_index") int answerIndex,
		@JsonProperty("chosen_index") Integer chosenIndex,
		@JsonProperty("is_correct") Boolean isCorrect,
		String explanation,
		@JsonProperty("tested_concept") String testedConcept,
		String difficulty,
		String purpose,
		@JsonProperty("file_path") String filePath,
		@JsonProperty("line_start") Integer lineStart,
		@JsonProperty("line_end") Integer lineEnd,
		@JsonProperty("elapsed_ms") int elapsedMs,
		AiReportCohort cohort) {

	/**
	 * 같은 문항을 푼 학생 전체 집계. correct_rate 는 보내지 않아도 AI 쪽이 계산하고,
	 * 응시자가 신뢰 최소 인원에 못 미치면 AI 쪽 검증이 알아서 버린다.
	 */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record AiReportCohort(
			int attempted,
			int correct,
			@JsonProperty("choice_distribution") List<Integer> choiceDistribution) {
	}
}
