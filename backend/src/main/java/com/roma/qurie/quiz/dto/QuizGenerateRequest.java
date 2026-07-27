package com.roma.qurie.quiz.dto;

import java.util.List;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.roma.qurie.quiz.entity.QuizGenerationMode;
import com.roma.qurie.quiz.entity.QuizType;

public record QuizGenerateRequest(
		@NotNull QuizGenerationMode mode,
		Long snapshotId,
		@Min(1) @Max(50) int count,
		@NotEmpty List<QuizType> types,
		@Min(0) @Max(100) int ratioEasy,
		@Min(0) @Max(100) int ratioNormal,
		@Min(0) @Max(100) int ratioHard,
		@Size(max = 2000) String userPrompt,
		@NotNull Long createdBy) {

	@AssertTrue(message = "난이도 비율의 합은 100이어야 합니다.")
	public boolean isDifficultyRatioValid() {
		return ratioEasy + ratioNormal + ratioHard == 100;
	}
}
