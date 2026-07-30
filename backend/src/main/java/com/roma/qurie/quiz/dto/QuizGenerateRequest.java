package com.roma.qurie.quiz.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.roma.qurie.quiz.entity.QuizGenerationMode;

/**
 * 퀴즈 생성 요청. AI 서버는 DB(스냅샷)를 조회하지 않으므로 출제 대상 코드는
 * files(경로→내용)로 요청 본문에 직접 담아 보낸다.
 *
 * count 상한 20, userPrompt 500자, versionHash 64자는 AI 서버(CreateQuizSetRequest) 계약과
 * 맞춘 값이다 — 여기서 더 받아줘도 AI 쪽 접수에서 422 로 떨어진다.
 *
 * createdBy 는 요청자가 직접 지정하지 않는다 — 컨트롤러가 인증 주체(AuthUser)에서 뽑아 서비스에 넘긴다.
 */
public record QuizGenerateRequest(
		@NotNull QuizGenerationMode mode,
		@Min(1) @Max(20) int count,
		@Min(0) @Max(100) int ratioEasy,
		@Min(0) @Max(100) int ratioNormal,
		@Min(0) @Max(100) int ratioHard,
		@Size(max = 500) String userPrompt,
		@NotBlank @Size(max = 64) String versionHash,
		List<String> targetFiles,
		@NotEmpty Map<String, String> files) {

	/** AI 는 상대 가중치라 합이 100일 필요가 없다 — 전부 0인 경우만 막는다. */
	@AssertTrue(message = "난이도 비율 중 하나 이상은 0보다 커야 합니다.")
	public boolean isDifficultyRatioValid() {
		return ratioEasy + ratioNormal + ratioHard > 0;
	}
}
