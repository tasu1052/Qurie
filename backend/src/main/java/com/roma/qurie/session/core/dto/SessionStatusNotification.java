package com.roma.qurie.session.core.dto;

import java.time.LocalDateTime;

/** 세션 종료(닫힘)를 세션 웹소켓 토픽으로 알릴 때 담는 payload. 방에 남은 구성원이 즉시 종료를 알 수 있게 한다. */
public record SessionStatusNotification(Long sessionId, boolean active, LocalDateTime endedAt) {
}
