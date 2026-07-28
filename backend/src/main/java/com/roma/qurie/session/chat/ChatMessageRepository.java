package com.roma.qurie.session.chat;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	List<ChatMessage> findBySessionIdOrderByIdDesc(
			Long sessionId,
			Pageable pageable);

	List<ChatMessage> findBySessionIdAndIdLessThanOrderByIdDesc(
			Long sessionId,
			Long id,
			Pageable pageable);
}
