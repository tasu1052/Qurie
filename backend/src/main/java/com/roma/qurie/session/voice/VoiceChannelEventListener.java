package com.roma.qurie.session.voice;

import com.roma.qurie.session.voice.dto.VoiceChannelEventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket 연결이 끊긴 사용자를 음성 채널에서도 내보낸다. 탭을 닫거나 네트워크가 끊겨
 * voice/leave 를 못 보낸 경우에도 남은 참가자들이 통화 목록을 정확히 보게 하기 위해서다.
 */
@Component
@RequiredArgsConstructor
public class VoiceChannelEventListener {

	private final VoiceChannelRegistry registry;
	private final SimpMessagingTemplate messagingTemplate;

	@EventListener
	public void handleDisconnect(SessionDisconnectEvent event) {
		registry.disconnect(event.getSessionId())
				.forEach(departure -> messagingTemplate.convertAndSend(
						voiceDestination(departure.sessionId()),
						VoiceChannelEventResponse.left(
								departure.sessionId(),
								departure.participant(),
								departure.participants())));
	}

	private String voiceDestination(Long sessionId) {
		return "/topic/sessions/" + sessionId + "/voice";
	}
}
