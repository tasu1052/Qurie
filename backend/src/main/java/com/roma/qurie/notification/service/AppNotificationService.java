package com.roma.qurie.notification.service;

import java.util.Collection;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.notification.dto.AppNotificationResponse;
import com.roma.qurie.notification.entity.AppNotification;
import com.roma.qurie.notification.repository.AppNotificationRepository;
import com.roma.qurie.security.AuthUser;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppNotificationService {

	public static final String TYPE_SESSION_OPENED = "SESSION_OPENED";
	public static final String TYPE_REPORT_COMMENT = "REPORT_COMMENT";

	private final AppNotificationRepository notificationRepository;

	@Transactional
	public void notifyUsers(
			Collection<Long> userIds, String type, String title, String body, String link) {
		if (userIds == null || userIds.isEmpty()) {
			return;
		}
		List<AppNotification> rows = userIds.stream()
				.distinct()
				.map(userId -> new AppNotification(userId, type, title, body, link))
				.toList();
		notificationRepository.saveAll(rows);
	}

	@Transactional(readOnly = true)
	public List<AppNotificationResponse> listMine(AuthUser requester) {
		requireAuth(requester);
		return notificationRepository.findTop30ByUserIdOrderByIdDesc(requester.id()).stream()
				.map(AppNotificationResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount(AuthUser requester) {
		requireAuth(requester);
		return notificationRepository.countByUserIdAndReadAtIsNull(requester.id());
	}

	@Transactional
	public void markAllRead(AuthUser requester) {
		requireAuth(requester);
		notificationRepository.markAllRead(requester.id());
	}

	private void requireAuth(AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
	}
}
