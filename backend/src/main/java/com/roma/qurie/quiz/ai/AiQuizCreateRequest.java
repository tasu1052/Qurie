package com.roma.qurie.quiz.ai;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.entity.QuizGenerationMode;

/**
 * AI 서버 POST /api/quiz 요청 본문. ai_service 의 CreateQuizSetRequest(pydantic)와 필드가 1:1 이며
 * snake_case 라 @JsonProperty 로 못박는다.
 *
 * AI 서버는 DB 를 보지 않으므로 코드는 files(경로→내용)로 본문에 직접 실어 보낸다.
 */
public record AiQuizCreateRequest(
		AiQuizMode mode,
		@JsonProperty("requested_count") int requestedCount,
		AiDifficultyRatio ratio,
		@JsonProperty("user_prompt") String userPrompt,
		@JsonProperty("version_hash") String versionHash,
		@JsonProperty("target_files") List<String> targetFiles,
		Map<String, String> files) {

	public static AiQuizCreateRequest from(QuizGenerateRequest request) {
		return new AiQuizCreateRequest(
				AiQuizMode.from(request.mode()),
				request.count(),
				new AiDifficultyRatio(request.ratioEasy(), request.ratioNormal(), request.ratioHard()),
				request.userPrompt(),
				request.versionHash(),
				request.targetFiles(),
				request.files());
	}

	public record AiDifficultyRatio(int easy, int normal, int hard) {
	}

	/**
	 * AI 서버의 QuizMode. 우리 QuizGenerationMode(INITIAL/REVIEW)와 이름이 달라 매핑한다 —
	 * 첫 출제(INITIAL)는 평가(ASSESSMENT), 복습(REVIEW)은 연습(PRACTICE)으로 본다.
	 */
	public enum AiQuizMode {

		ASSESSMENT,
		PRACTICE;

		public static AiQuizMode from(QuizGenerationMode mode) {
			return mode == QuizGenerationMode.REVIEW ? PRACTICE : ASSESSMENT;
		}
	}
}
