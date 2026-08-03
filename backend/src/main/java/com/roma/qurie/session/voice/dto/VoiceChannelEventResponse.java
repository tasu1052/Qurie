package com.roma.qurie.session.voice.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VoiceChannelEventResponse(
		Type type,
		Long sessionId,
		VoiceParticipantResponse participant,
		List<VoiceParticipantResponse> participants,
		LocalDateTime occurredAt) {

	public enum Type {
		JOINED,
		LEFT,
		STATE_CHANGED
	}

	public static VoiceChannelEventResponse joined(
			Long sessionId,
			VoiceParticipantResponse participant,
			List<VoiceParticipantResponse> participants) {
		return new VoiceChannelEventResponse(Type.JOINED, sessionId, participant, participants, LocalDateTime.now());
	}

	public static VoiceChannelEventResponse left(
			Long sessionId,
			VoiceParticipantResponse participant,
			List<VoiceParticipantResponse> participants) {
		return new VoiceChannelEventResponse(Type.LEFT, sessionId, participant, participants, LocalDateTime.now());
	}

	public static VoiceChannelEventResponse stateChanged(
			Long sessionId,
			VoiceParticipantResponse participant,
			List<VoiceParticipantResponse> participants) {
		return new VoiceChannelEventResponse(
				Type.STATE_CHANGED, sessionId, participant, participants, LocalDateTime.now());
	}
}
