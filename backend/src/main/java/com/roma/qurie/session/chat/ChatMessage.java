package com.roma.qurie.session.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "session_chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "session_id", nullable = false)
	private Long sessionId;

	@Column(name = "sender_id", nullable = false)
	private Long senderId;

	@Column(name = "sender_name", nullable = false, length = 50)
	private String senderName;

	@Column(name = "content", nullable = false, length = 1000)
	private String content;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public ChatMessage(
			Long sessionId,
			Long senderId,
			String senderName,
			String content) {
		this.sessionId = sessionId;
		this.senderId = senderId;
		this.senderName = senderName;
		this.content = content;
	}
}
