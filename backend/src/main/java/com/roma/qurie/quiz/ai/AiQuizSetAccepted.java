package com.roma.qurie.quiz.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

/** AI 서버 POST /api/quiz 응답. 생성은 백그라운드로 넘어가고 접수 사실만 돌려받는다. */
public record AiQuizSetAccepted(
		@JsonProperty("quiz_set_id") Long quizSetId,
		String project,
		String status) {
}
