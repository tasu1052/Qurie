package com.roma.qurie.session.chat;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.dto.ChatMessageResponse;
import com.roma.qurie.session.chat.dto.ChatSendRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ChatService {

	private static final int DEFAULT_HISTORY_SIZE = 50;
	private static final int MAX_HISTORY_SIZE = 100;

	private final ChatMessageRepository chatMessageRepository;

	@Transactional
	public ChatMessageResponse send(
			Long sessionId,
			AuthUser sender,
			ChatSendRequest request) {
		ChatMessage message = new ChatMessage(
				sessionId,
				sender.id(),
				sender.name(),
				request.content().trim());
		return ChatMessageResponse.from(chatMessageRepository.save(message));
	}

	@Transactional(readOnly = true)
	public List<ChatMessageResponse> getMessages(
			Long sessionId,
			Long beforeId,
			Integer requestedSize) {
		int size = normalizeSize(requestedSize);
		PageRequest pageRequest = PageRequest.of(0, size);
		List<ChatMessage> messages = beforeId == null
				? chatMessageRepository.findBySessionIdOrderByIdDesc(sessionId, pageRequest)
				: chatMessageRepository.findBySessionIdAndIdLessThanOrderByIdDesc(
						sessionId,
						beforeId,
						pageRequest);
		return messages.stream()
				.map(ChatMessageResponse::from)
				.toList();
	}

	private int normalizeSize(Integer requestedSize) {
		if (requestedSize == null) {
			return DEFAULT_HISTORY_SIZE;
		}
		if (requestedSize < 1 || requestedSize > MAX_HISTORY_SIZE) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"size는 1 이상 100 이하여야 합니다.");
		}
		return requestedSize;
	}
}
