package com.roma.qurie.session.voice.dto;

import java.time.LocalDateTime;

public record VoiceErrorResponse(
		String message,
		LocalDateTime occurredAt) {

	public static VoiceErrorResponse of(String message) {
		return new VoiceErrorResponse(message, LocalDateTime.now());
	}
}
