package com.roma.qurie.session.participant.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SessionParticipantEventResponse(
		Type type,
		Long sessionId,
		SessionParticipantResponse participant,
		List<SessionParticipantResponse> participants,
		LocalDateTime occurredAt) {

	public enum Type {
		ENTER,
		LEAVE
	}

	public static SessionParticipantEventResponse enter(
			Long sessionId,
			SessionParticipantResponse participant,
			List<SessionParticipantResponse> participants) {
		return new SessionParticipantEventResponse(
				Type.ENTER,
				sessionId,
				participant,
				participants,
				LocalDateTime.now());
	}

	public static SessionParticipantEventResponse leave(
			Long sessionId,
			SessionParticipantResponse participant,
			List<SessionParticipantResponse> participants) {
		return new SessionParticipantEventResponse(
				Type.LEAVE,
				sessionId,
				participant,
				participants,
				LocalDateTime.now());
	}
}
