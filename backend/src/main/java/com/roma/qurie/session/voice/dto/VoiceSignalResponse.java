package com.roma.qurie.session.voice.dto;

import java.time.LocalDateTime;

public record VoiceSignalResponse(
		Long fromUserId,
		String type,
		String payload,
		LocalDateTime occurredAt) {

	public static VoiceSignalResponse of(Long fromUserId, String type, String payload) {
		return new VoiceSignalResponse(fromUserId, type, payload, LocalDateTime.now());
	}
}
