package com.roma.qurie.report.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record UserReportCreateRequest(
        @NotNull Long classId,

        @Min(0) int sessionCount,
        @Min(0) int quizTotalCount,
        @Min(0) int quizAttemptedCount,
        @Min(0) int quizCorrectCount,
        @Min(0) int quizSkippedCount,

        @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal completionRate,
        @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal accuracy,
        @Min(0) Integer avgElapsedMs,

        Map<String, Object> difficultyRatio,
        Map<String, Object> conceptStats,

        BigDecimal rating,
        @Size(max = 20) String ratingFormulaVersion) {
}
