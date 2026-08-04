package com.roma.qurie.report.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** 세션/유저 리포트가 같은 정의로 지표를 계산하도록 모아 둔 공통 헬퍼. */
final class ReportMath {

    private ReportMath() {
    }

    /** 분모가 0이면 "집계할 데이터 없음"이므로 0% 가 아니라 null 을 남긴다. */
    static BigDecimal percentOf(int numerator, int denominator) {
        if (denominator == 0) {
            return null;
        }
        return BigDecimal.valueOf(numerator * 100L)
                .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }
}
