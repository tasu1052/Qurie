package com.roma.qurie.session.chat;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.dto.ChatMessageResponse;
import com.roma.qurie.session.participant.SessionParticipantService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions/{sessionId}/messages")
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;
	private final SessionParticipantService participantService;

	@GetMapping
	public List<ChatMessageResponse> getMessages(
			@PathVariable Long sessionId,
			@RequestParam(required = false) Long beforeId,
			@RequestParam(required = false) Integer size,
			@AuthenticationPrincipal AuthUser requester) {
		participantService.verifyCanEnter(sessionId, requester);
		return chatService.getMessages(sessionId, beforeId, size);
	}
}
