package com.roma.qurie.session.participant;

import com.roma.qurie.session.participant.dto.SessionParticipantEventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class SessionPresenceEventListener {

	private final SessionPresenceRegistry presenceRegistry;
	private final SimpMessagingTemplate messagingTemplate;

	@EventListener
	public void handleDisconnect(SessionDisconnectEvent event) {
		presenceRegistry.disconnect(event.getSessionId())
				.forEach(departure -> messagingTemplate.convertAndSend(
						participantDestination(departure.sessionId()),
						SessionParticipantEventResponse.leave(
								departure.sessionId(),
								departure.participant(),
								departure.participants())));
	}

	private String participantDestination(Long sessionId) {
		return "/topic/sessions/" + sessionId + "/participants";
	}
}
