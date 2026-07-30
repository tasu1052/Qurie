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
import com.roma.qurie.quiz.entity.QuizType;

/**
 * 퀴즈 생성 요청. AI 서버는 DB(스냅샷)를 조회하지 않으므로 출제 대상 코드는
 * files(경로→내용)로 요청 본문에 직접 담아 보낸다.
 *
 * count 상한 20, userPrompt 500자, versionHash 64자는 AI 서버(CreateQuizSetRequest) 계약과
 * 맞춘 값이다 — 여기서 더 받아줘도 AI 쪽 접수에서 422 로 떨어진다.
 */
public record QuizGenerateRequest(
		@NotNull QuizGenerationMode mode,
		Long snapshotId,
		@Min(1) @Max(20) int count,
		@NotEmpty List<QuizType> types,
		@Min(0) @Max(100) int ratioEasy,
		@Min(0) @Max(100) int ratioNormal,
		@Min(0) @Max(100) int ratioHard,
		@Size(max = 500) String userPrompt,
		@NotBlank @Size(max = 64) String versionHash,
		List<String> targetFiles,
		@NotEmpty Map<String, String> files,
		@NotNull Long createdBy) {

	@AssertTrue(message = "난이도 비율의 합은 100이어야 합니다.")
	public boolean isDifficultyRatioValid() {
		return ratioEasy + ratioNormal + ratioHard == 100;
	}
}
