package com.roma.qurie.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.notification.entity.AppNotification;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

	List<AppNotification> findTop30ByUserIdOrderByIdDesc(Long userId);

	long countByUserIdAndReadAtIsNull(Long userId);

	@Modifying
	@Query("update AppNotification n set n.readAt = CURRENT_TIMESTAMP where n.userId = :userId and n.readAt is null")
	int markAllRead(@Param("userId") Long userId);
}
