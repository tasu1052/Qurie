package com.roma.qurie.session.voice;

import com.roma.qurie.session.voice.dto.VoiceChannelEventResponse;
import com.roma.qurie.session.voice.dto.VoiceErrorResponse;
import com.roma.qurie.session.voice.dto.VoiceSignalRequest;
import com.roma.qurie.session.voice.dto.VoiceStateUpdateRequest;
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

/**
 * 음성 채널 실시간 처리. 채널 상태 변화(참여/퇴장/음소거)는 세션 전체 토픽으로 브로드캐스트하고,
 * WebRTC 시그널(offer/answer/candidate)은 대상 사용자 전용 토픽으로만 중계한다.
 */
@Controller
@RequiredArgsConstructor
public class VoiceWebSocketController {

	private final VoiceChannelService voiceChannelService;
	private final SimpMessagingTemplate messagingTemplate;

	/** 통화 시작(참여). 이미 참여 중이면 재참여로 처리돼 상태가 초기화된다. */
	@MessageMapping("/sessions/{sessionId}/voice/join")
	public void join(
			@DestinationVariable Long sessionId,
			Principal principal,
			SimpMessageHeaderAccessor headerAccessor) {
		VoiceChannelEventResponse event =
				voiceChannelService.join(sessionId, requireConnectionId(headerAccessor), principal);
		messagingTemplate.convertAndSend(voiceDestination(sessionId), event);
	}

	/** 통화 끊기. 참여 중이 아니었으면 아무 일도 일어나지 않는다. */
	@MessageMapping("/sessions/{sessionId}/voice/leave")
	public void leave(@DestinationVariable Long sessionId, Principal principal) {
		VoiceChannelEventResponse event = voiceChannelService.leave(sessionId, principal);
		if (event == null) {
			return;
		}
		messagingTemplate.convertAndSend(voiceDestination(sessionId), event);
	}

	/** 마이크 버튼(micMuted)·헤드셋 버튼(deafened) 상태 변경. */
	@MessageMapping("/sessions/{sessionId}/voice/state")
	public void updateState(
			@DestinationVariable Long sessionId,
			@Valid @Payload VoiceStateUpdateRequest request,
			Principal principal) {
		VoiceChannelEventResponse event = voiceChannelService.updateState(sessionId, principal, request);
		messagingTemplate.convertAndSend(voiceDestination(sessionId), event);
	}

	/** WebRTC 시그널 중계. 대상 사용자만 구독할 수 있는 토픽으로 보낸다. */
	@MessageMapping("/sessions/{sessionId}/voice/signal")
	public void relaySignal(
			@DestinationVariable Long sessionId,
			@Valid @Payload VoiceSignalRequest request,
			Principal principal) {
		VoiceChannelService.SignalRelay relay = voiceChannelService.relaySignal(sessionId, principal, request);
		messagingTemplate.convertAndSend(
				signalDestination(sessionId, relay.targetUserId()), relay.signal());
	}

	@MessageExceptionHandler
	@SendToUser(destinations = "/queue/errors", broadcast = false)
	public VoiceErrorResponse handleException(Exception exception) {
		if (exception instanceof ResponseStatusException responseStatusException
				&& responseStatusException.getReason() != null) {
			return VoiceErrorResponse.of(responseStatusException.getReason());
		}
		return VoiceErrorResponse.of("음성 채널 요청을 처리하지 못했습니다.");
	}

	private String requireConnectionId(SimpMessageHeaderAccessor headerAccessor) {
		String connectionId = headerAccessor.getSessionId();
		if (connectionId == null) {
			throw new IllegalStateException("WebSocket 연결 식별자가 없습니다.");
		}
		return connectionId;
	}

	private String voiceDestination(Long sessionId) {
		return "/topic/sessions/" + sessionId + "/voice";
	}

	private String signalDestination(Long sessionId, Long targetUserId) {
		return "/topic/sessions/" + sessionId + "/voice/signal/" + targetUserId;
	}
}
