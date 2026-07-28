package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.LoginResponse;

/**
 * 로그인/재발급 성공 결과. accessToken/refreshToken은 컨트롤러가 쿠키를 만드는 데만 쓰고
 * 응답 바디에는 넣지 않는다.
 */
record AuthResult(String accessToken, String refreshToken, LoginResponse user) {}
