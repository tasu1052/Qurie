package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThat;

import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class SessionPresenceRegistryTest {

	private static final Long SESSION_ID = 1L;
	private static final SessionParticipantResponse PARTICIPANT =
			new SessionParticipantResponse(10L, "참여자", "STUDENT");

	private final SessionPresenceRegistry registry = new SessionPresenceRegistry();

	@Test
	void enterKeepsOneParticipantForMultipleConnections() {
		SessionPresenceRegistry.JoinResult first =
				registry.enter(SESSION_ID, "connection-1", PARTICIPANT);
		SessionPresenceRegistry.JoinResult second =
				registry.enter(SESSION_ID, "connection-2", PARTICIPANT);

		assertThat(first.firstConnection()).isTrue();
		assertThat(second.firstConnection()).isFalse();
		assertThat(registry.participants(SESSION_ID)).containsExactly(PARTICIPANT);
	}

	@Test
	void leaveRemovesParticipantOnlyAfterLastConnection() {
		registry.enter(SESSION_ID, "connection-1", PARTICIPANT);
		registry.enter(SESSION_ID, "connection-2", PARTICIPANT);

		assertThat(registry.leave(SESSION_ID, "connection-1", PARTICIPANT.userId())).isEmpty();
		assertThat(registry.participants(SESSION_ID)).containsExactly(PARTICIPANT);

		SessionPresenceRegistry.Departure departure =
				registry.leave(SESSION_ID, "connection-2", PARTICIPANT.userId()).orElseThrow();
		assertThat(departure.participant()).isEqualTo(PARTICIPANT);
		assertThat(departure.participants()).isEmpty();
		assertThat(registry.participants(SESSION_ID)).isEmpty();
	}

	@Test
	void disconnectRemovesConnectionFromEveryEnteredSession() {
		registry.enter(SESSION_ID, "connection-1", PARTICIPANT);
		registry.enter(2L, "connection-1", PARTICIPANT);

		List<SessionPresenceRegistry.Departure> departures =
				registry.disconnect("connection-1");

		assertThat(departures)
				.extracting(SessionPresenceRegistry.Departure::sessionId)
				.containsExactlyInAnyOrder(SESSION_ID, 2L);
		assertThat(registry.participants(SESSION_ID)).isEmpty();
		assertThat(registry.participants(2L)).isEmpty();
	}

	@Test
	void enteringSameConnectionTwiceIsIdempotent() {
		registry.enter(SESSION_ID, "connection-1", PARTICIPANT);

		SessionPresenceRegistry.JoinResult duplicate =
				registry.enter(SESSION_ID, "connection-1", PARTICIPANT);

		assertThat(duplicate.firstConnection()).isFalse();
		assertThat(registry.disconnect("connection-1")).hasSize(1);
	}
}
