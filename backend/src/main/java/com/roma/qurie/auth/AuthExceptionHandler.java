package com.roma.qurie.auth;

import com.roma.qurie.common.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * auth 패키지에만 적용되는 예외 처리기. 다른 도메인의 에러 응답 포맷에는 영향을 주지 않는다.
 */
@RestControllerAdvice(basePackages = "com.roma.qurie.auth")
public class AuthExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException e) {
        return ResponseEntity.status(e.getStatus()).body(ErrorResponse.of(e.getCode(), e.getMessage()));
    }
}
