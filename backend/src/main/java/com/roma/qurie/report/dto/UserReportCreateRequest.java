package com.roma.qurie.report.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * 사용자 최종 리포트 발급 요청. 정량 지표는 서버가 그 반의 세션 리포트들을 합산해 계산하므로 받지 않는다.
 * 평점은 공식이 확정되지 않아(Planning OPEN-01) 전달값을 산출 버전과 함께 저장만 한다.
 */
public record UserReportCreateRequest(
        @NotNull Long classId,
        BigDecimal rating,
        @Size(max = 20) String ratingFormulaVersion) {
}
