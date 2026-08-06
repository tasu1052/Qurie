package com.roma.qurie.notification.entity;

import java.time.LocalDateTime;

import com.roma.qurie.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 학생·강사 공통 인앱 알림(벨). */
@Getter
@Entity
@Table(name = "app_notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppNotification extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "type", nullable = false, length = 40)
	private String type;

	@Column(name = "title", nullable = false, length = 120)
	private String title;

	@Column(name = "body", length = 500)
	private String body;

	@Column(name = "link", length = 300)
	private String link;

	@Column(name = "read_at")
	private LocalDateTime readAt;

	public AppNotification(Long userId, String type, String title, String body, String link) {
		this.userId = userId;
		this.type = type;
		this.title = title;
		this.body = body;
		this.link = link;
	}

	public void markRead() {
		if (this.readAt == null) {
			this.readAt = LocalDateTime.now();
		}
	}

	public boolean isUnread() {
		return readAt == null;
	}
}
