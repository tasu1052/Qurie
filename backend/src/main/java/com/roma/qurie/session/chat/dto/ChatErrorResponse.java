package com.roma.qurie.session.chat.dto;

import java.time.LocalDateTime;

public record ChatErrorResponse(
		String message,
		LocalDateTime occurredAt) {

	public static ChatErrorResponse of(String message) {
		return new ChatErrorResponse(message, LocalDateTime.now());
	}
}
