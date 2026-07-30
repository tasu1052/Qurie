package com.roma.qurie.quiz.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI 서버 GET /api/quiz/{id}/status 응답. ai_service 의 QuizResponse 에서 우리가 저장에 쓰는
 * 필드만 담는다 — rejected(탈락 문항)·meter(LLM 호출 로그)는 AI 쪽 분석용이라 받지 않는다.
 */
public record AiQuizStatusResponse(
		String project,
		@JsonProperty("quiz_set_id") Long quizSetId,
		AiQuizSetState status,
		List<AiQuiz> quizzes,
		@JsonProperty("error_message") String errorMessage) {

	public enum AiQuizSetState {

		PENDING,
		GENERATING,
		READY,
		FAILED
	}

	/** 생성된 문항 하나. 현재 AI 는 4지선다(choices + answer_index)만 만든다. */
	public record AiQuiz(
			String purpose,
			String difficulty,
			@JsonProperty("tested_concept") String testedConcept,
			String question,
			List<String> choices,
			@JsonProperty("answer_index") int answerIndex,
			String explanation,
			@JsonProperty("file_path") String filePath,
			@JsonProperty("line_start") Integer lineStart,
			@JsonProperty("line_end") Integer lineEnd) {
	}
}
