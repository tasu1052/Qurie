package com.roma.qurie.report.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

public record SessionReportCreateRequest(
        Long quizSetId,
        Long ordinaryUserId,
        @Min(0) int quizTotalCount,
        @Min(0) int quizAttemptedCount,
        @Min(0) int quizCorrectCount,
        @Min(0) int quizSkippedCount,

        @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal completionRate,
        @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal accuracy,
        @Min(0) Integer avgElapsedMs,

        Map<String, Object> difficultyRatio,
        Map<String, Object> conceptStats,
        BigDecimal quizRating,

        String aiComment,
        List<String> aiStrengths,
        List<String> aiImprovements) {
}
