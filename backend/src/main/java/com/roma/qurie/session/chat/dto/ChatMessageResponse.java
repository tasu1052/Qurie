package com.roma.qurie.session.chat.dto;

import com.roma.qurie.session.chat.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
		Long id,
		Long sessionId,
		Long senderId,
		String senderName,
		String content,
		LocalDateTime createdAt) {

	public static ChatMessageResponse from(ChatMessage message) {
		return new ChatMessageResponse(
				message.getId(),
				message.getSessionId(),
				message.getSenderId(),
				message.getSenderName(),
				message.getContent(),
				message.getCreatedAt());
	}
}
