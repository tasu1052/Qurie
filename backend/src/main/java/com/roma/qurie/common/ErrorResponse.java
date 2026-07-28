package com.roma.qurie.common;

import java.util.UUID;

/**
 * 프론트-백엔드 공유 에러 응답 포맷. requestId는 오류 화면에서 mono로 노출된다.
 */
public record ErrorResponse(String code, String message, String requestId) {

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, UUID.randomUUID().toString());
    }
}
