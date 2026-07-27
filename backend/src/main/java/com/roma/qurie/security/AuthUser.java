package com.roma.qurie.security;

/**
 * 인증된 요청의 principal. JWT 클레임을 그대로 담아 DB 재조회 없이 요청을 처리할 수 있게 한다.
 */
public record AuthUser(Long id, String role, Long enterpriseId, String email, String name) {}
