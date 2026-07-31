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
 * QuizGenerationMode 를 AI 의 QuizMode(ASSESSMENT/PRACTICE)와 이름 자체를 통일해 별도 매핑 없이 그대로 보낸다.
 */
public record AiQuizCreateRequest(
		QuizGenerationMode mode,
		@JsonProperty("requested_count") int requestedCount,
		AiDifficultyRatio ratio,
		@JsonProperty("user_prompt") String userPrompt,
		@JsonProperty("version_hash") String versionHash,
		@JsonProperty("target_files") List<String> targetFiles,
		Map<String, String> files,
		@JsonProperty("callback_url") String callbackUrl) {

	public static AiQuizCreateRequest from(QuizGenerateRequest request, String callbackUrl) {
		return new AiQuizCreateRequest(
				request.mode(),
				request.count(),
				new AiDifficultyRatio(request.ratioEasy(), request.ratioNormal(), request.ratioHard()),
				request.userPrompt(),
				request.versionHash(),
				// AI 쪽 target_files 는 Optional 이 아니라 기본값 있는 list 다 — 생략은 되지만 null 은 422 다.
				request.targetFiles() == null ? List.of() : request.targetFiles(),
				request.files(),
				callbackUrl);
	}

	public record AiDifficultyRatio(int easy, int normal, int hard) {
	}
}
