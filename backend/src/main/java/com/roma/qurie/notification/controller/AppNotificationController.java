package com.roma.qurie.notification.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.notification.dto.AppNotificationResponse;
import com.roma.qurie.notification.service.AppNotificationService;
import com.roma.qurie.security.AuthUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class AppNotificationController {

	private final AppNotificationService notificationService;

	@GetMapping
	public List<AppNotificationResponse> list(@AuthenticationPrincipal AuthUser requester) {
		return notificationService.listMine(requester);
	}

	@GetMapping("/unread-count")
	public Map<String, Long> unreadCount(@AuthenticationPrincipal AuthUser requester) {
		return Map.of("count", notificationService.unreadCount(requester));
	}

	@PostMapping("/read-all")
	public void markAllRead(@AuthenticationPrincipal AuthUser requester) {
		notificationService.markAllRead(requester);
	}
}
