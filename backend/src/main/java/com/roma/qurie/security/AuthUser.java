package com.roma.qurie.security;

/**
 * 인증된 요청의 principal. JWT 클레임을 그대로 담아 DB 재조회 없이 요청을 처리할 수 있게 한다.
 *
 * classId 는 소속 반. 매니저·학생이 반을 하나만 갖는다는 요구사항을 전제로 로그인 시점의 명단(class_users)에서
 * 채운다. 마스터는 명단에 담기지 않아 null 이고, 아직 반 배정 전인 사용자도 null 일 수 있다.
 * 토큰 발급 이후 반 배정이 바뀌면 재로그인(또는 refresh) 전까지 이전 값이 유지된다.
 */
public record AuthUser(Long id, String role, Long enterpriseId, String email, String name, Long classId) {}
