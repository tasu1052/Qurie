package com.roma.qurie.session.chat;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.dto.ChatErrorResponse;
import com.roma.qurie.session.chat.dto.ChatMessageResponse;
import com.roma.qurie.session.chat.dto.ChatSendRequest;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.session.participant.SessionPresenceRegistry;
import com.roma.qurie.session.participant.dto.SessionParticipantEventResponse;
import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

	private final ChatService chatService;
	private final SessionParticipantService participantService;
	private final SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/sessions/{sessionId}/enter")
	public void enter(
			@DestinationVariable Long sessionId,
			Principal principal,
			SimpMessageHeaderAccessor headerAccessor) {
		String connectionId = requireConnectionId(headerAccessor);
		SessionPresenceRegistry.JoinResult result =
				participantService.enter(sessionId, connectionId, principal);
		if (!result.firstConnection()) {
			return;
		}

		AuthUser authUser = participantService.requireAuthenticated(principal);
		messagingTemplate.convertAndSend(
				participantDestination(sessionId),
				SessionParticipantEventResponse.enter(
						sessionId,
						SessionParticipantResponse.from(authUser),
						result.participants()));
	}

	@MessageMapping("/sessions/{sessionId}/leave")
	public void leave(
			@DestinationVariable Long sessionId,
			Principal principal,
			SimpMessageHeaderAccessor headerAccessor) {
		SessionPresenceRegistry.Departure departure =
				participantService.leave(
						sessionId,
						requireConnectionId(headerAccessor),
						principal);
		if (departure == null) {
			return;
		}

		messagingTemplate.convertAndSend(
				participantDestination(sessionId),
				SessionParticipantEventResponse.leave(
						sessionId,
						departure.participant(),
						departure.participants()));
	}

	@MessageMapping("/sessions/{sessionId}/messages")
	public void send(
			@DestinationVariable Long sessionId,
			@Valid @Payload ChatSendRequest request,
			Principal principal,
			SimpMessageHeaderAccessor headerAccessor) {
		AuthUser sender = participantService.verifyCanEnter(sessionId, principal);
		participantService.verifyPresent(
				sessionId,
				requireConnectionId(headerAccessor),
				sender.id());
		ChatMessageResponse response = chatService.send(sessionId, sender, request);
		messagingTemplate.convertAndSend(messageDestination(sessionId), response);
	}

	@MessageExceptionHandler
	@SendToUser(destinations = "/queue/errors", broadcast = false)
	public ChatErrorResponse handleException(Exception exception) {
		if (exception instanceof ResponseStatusException responseStatusException
				&& responseStatusException.getReason() != null) {
			return ChatErrorResponse.of(responseStatusException.getReason());
		}
		return ChatErrorResponse.of("실시간 요청을 처리하지 못했습니다.");
	}

	private String requireConnectionId(SimpMessageHeaderAccessor headerAccessor) {
		String connectionId = headerAccessor.getSessionId();
		if (connectionId == null) {
			throw new IllegalStateException("WebSocket 연결 식별자가 없습니다.");
		}
		return connectionId;
	}

	private String messageDestination(Long sessionId) {
		return "/topic/sessions/" + sessionId + "/messages";
	}

	private String participantDestination(Long sessionId) {
		return "/topic/sessions/" + sessionId + "/participants";
	}
}
