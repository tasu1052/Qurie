package com.roma.qurie.auth;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * auth 도메인 전용 예외. 공유 문서의 {code, message, requestId} 에러 응답 포맷을 지키기 위해
 * 다른 도메인의 ResponseStatusException 직접 사용 관례 대신 별도 예외 타입을 둔다.
 */
@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AuthException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
