package com.roma.qurie.quiz.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** 퀴즈 생성 완료 후 만족도. rating 은 1–5. */
public record QuizSatisfactionRequest(
		@Min(1) @Max(5) int rating,
		@Size(max = 500) String comment) {
}
