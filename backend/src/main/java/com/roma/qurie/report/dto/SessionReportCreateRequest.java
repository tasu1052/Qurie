package com.roma.qurie.report.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotNull;

/**
 * 세션 리포트 발급 요청. 정량 지표(문항 수·정답률 등)는 서버가 quiz_progress 에서 집계하므로
 * 받지 않는다 — 클라이언트가 보낸 숫자를 저장하면 조회 화면과 어긋나거나 조작될 수 있다.
 * 서버가 계산할 수 없는 정성 항목(AI 코멘트·평점)만 담는다.
 */
public record SessionReportCreateRequest(
        @NotNull Long ordinaryUserId,
        BigDecimal quizRating,
        String aiComment,
        List<String> aiStrengths,
        List<String> aiImprovements) {
}
