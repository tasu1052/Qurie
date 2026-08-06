package com.roma.qurie.notification.dto;

import java.time.LocalDateTime;

import com.roma.qurie.notification.entity.AppNotification;

public record AppNotificationResponse(
		Long id,
		String type,
		String title,
		String body,
		String link,
		boolean unread,
		LocalDateTime createdAt) {

	public static AppNotificationResponse from(AppNotification n) {
		return new AppNotificationResponse(
				n.getId(),
				n.getType(),
				n.getTitle(),
				n.getBody(),
				n.getLink(),
				n.isUnread(),
				n.getCreatedAt());
	}
}
