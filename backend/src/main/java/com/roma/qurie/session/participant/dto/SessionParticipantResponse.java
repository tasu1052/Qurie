package com.roma.qurie.session.participant.dto;

import com.roma.qurie.security.AuthUser;

public record SessionParticipantResponse(
		Long userId,
		String name,
		String role) {

	public static SessionParticipantResponse from(AuthUser authUser) {
		return new SessionParticipantResponse(
				authUser.id(),
				authUser.name(),
				authUser.role());
	}
}
