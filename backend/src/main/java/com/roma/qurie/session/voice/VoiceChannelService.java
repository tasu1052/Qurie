package com.roma.qurie.session.voice;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import com.roma.qurie.session.voice.dto.VoiceChannelEventResponse;
import com.roma.qurie.session.voice.dto.VoiceParticipantResponse;
import com.roma.qurie.session.voice.dto.VoiceSignalRequest;
import com.roma.qurie.session.voice.dto.VoiceSignalResponse;
import com.roma.qurie.session.voice.dto.VoiceStateUpdateRequest;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class VoiceChannelService {

	private static final String NOT_IN_CHANNEL_MESSAGE = "음성 채널에 참여하고 있지 않습니다.";
	private static final String TARGET_NOT_IN_CHANNEL_MESSAGE = "상대가 음성 채널에 없습니다.";
	private static final String SELF_SIGNAL_MESSAGE = "자기 자신에게는 시그널을 보낼 수 없습니다.";

	private final SessionParticipantService participantService;
	private final VoiceChannelRegistry registry;

	/** 음성 참여는 방 입장(presence)이 선행돼야 한다 — 채팅 전송과 같은 기준이다. */
	public VoiceChannelEventResponse join(Long sessionId, String connectionId, Principal principal) {
		AuthUser authUser = participantService.verifyCanEnter(sessionId, principal);
		participantService.verifyPresent(sessionId, connectionId, authUser.id());

		VoiceChannelRegistry.JoinResult result =
				registry.join(sessionId, connectionId, SessionParticipantResponse.from(authUser));
		return VoiceChannelEventResponse.joined(sessionId, result.participant(), result.participants());
	}

	/** 통화 끊기. 세션이 이미 종료됐어도 나갈 수는 있어야 하므로 인증만 요구한다. 참여 중이 아니면 null. */
	public VoiceChannelEventResponse leave(Long sessionId, Principal principal) {
		AuthUser authUser = participantService.requireAuthenticated(principal);
		return registry.leave(sessionId, authUser.id())
				.map(departure -> VoiceChannelEventResponse.left(
						sessionId, departure.participant(), departure.participants()))
				.orElse(null);
	}

	/** 마이크/헤드셋 음소거 상태 변경. 채널 참여 자체가 입장 검증을 통과한 증거라 인증만 다시 확인한다. */
	public VoiceChannelEventResponse updateState(
			Long sessionId,
			Principal principal,
			VoiceStateUpdateRequest request) {
		AuthUser authUser = participantService.requireAuthenticated(principal);
		VoiceParticipantResponse updated =
				registry.updateState(sessionId, authUser.id(), request.micMuted(), request.deafened())
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.FORBIDDEN, NOT_IN_CHANNEL_MESSAGE));
		return VoiceChannelEventResponse.stateChanged(sessionId, updated, registry.participants(sessionId));
	}

	/** WebRTC 시그널 중계. 보낸 사람·받을 사람 모두 채널에 있어야 하고, 내용은 해석하지 않는다. */
	public SignalRelay relaySignal(Long sessionId, Principal principal, VoiceSignalRequest request) {
		AuthUser authUser = participantService.requireAuthenticated(principal);
		if (authUser.id().equals(request.targetUserId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, SELF_SIGNAL_MESSAGE);
		}
		if (!registry.isMember(sessionId, authUser.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_IN_CHANNEL_MESSAGE);
		}
		if (!registry.isMember(sessionId, request.targetUserId())) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, TARGET_NOT_IN_CHANNEL_MESSAGE);
		}
		return new SignalRelay(
				request.targetUserId(),
				VoiceSignalResponse.of(authUser.id(), request.type(), request.payload()));
	}

	/** 현재 통화 중인 참여자 목록. 세션 화면 첫 렌더에서 음성 아이콘 상태를 그릴 때 쓴다. */
	public List<VoiceParticipantResponse> getParticipants(Long sessionId, AuthUser authUser) {
		participantService.verifyCanEnter(sessionId, authUser);
		return registry.participants(sessionId);
	}

	public record SignalRelay(Long targetUserId, VoiceSignalResponse signal) {
	}
}
