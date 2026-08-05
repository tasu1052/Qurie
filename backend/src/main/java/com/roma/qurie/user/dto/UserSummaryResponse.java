package com.roma.qurie.user.dto;

import java.time.LocalDateTime;

import com.roma.qurie.user.entity.UserRole;

/**
 * 회원 목록 및 마스터 대시보드 매니저 활동 카드용 요약.
 * weeklySessionCount 와 lastSessionCreatedAt 은 저장하지 않고 조회 시점에 sessions 에서 집계한다.
 *
 * lastSessionCreatedAt 은 "최근 N일 세션 운영 없음" 문구를 프론트가 직접 판단할 수 있도록 함께 내려준다.
 */
public record UserSummaryResponse(
		Long id,
		String name,
		String email,
		UserRole role,
		String phone,
		String region,
		String gender,
		Long weeklySessionCount,
		LocalDateTime lastSessionCreatedAt) {}
