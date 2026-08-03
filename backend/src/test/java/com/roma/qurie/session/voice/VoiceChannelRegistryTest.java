package com.roma.qurie.session.voice;

import static org.assertj.core.api.Assertions.assertThat;

import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import com.roma.qurie.session.voice.dto.VoiceParticipantResponse;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class VoiceChannelRegistryTest {

	private static final Long SESSION_ID = 15L;

	private final VoiceChannelRegistry registry = new VoiceChannelRegistry();

	@Test
	void joinAddsMemberWithUnmutedDefaults() {
		VoiceChannelRegistry.JoinResult result = registry.join(SESSION_ID, "conn-1", student(7L));

		assertThat(result.participant().micMuted()).isFalse();
		assertThat(result.participant().deafened()).isFalse();
		assertThat(result.participants()).extracting(VoiceParticipantResponse::userId).containsExactly(7L);
	}

	@Test
	void deafenForcesMicMute() {
		registry.join(SESSION_ID, "conn-1", student(7L));

		Optional<VoiceParticipantResponse> updated = registry.updateState(SESSION_ID, 7L, false, true);

		assertThat(updated).isPresent();
		assertThat(updated.get().deafened()).isTrue();
		assertThat(updated.get().micMuted()).isTrue();
	}

	@Test
	void updateStateForNonMemberReturnsEmpty() {
		assertThat(registry.updateState(SESSION_ID, 7L, true, false)).isEmpty();
	}

	@Test
	void rejoinReplacesMembershipAndResetsState() {
		registry.join(SESSION_ID, "conn-1", student(7L));
		registry.updateState(SESSION_ID, 7L, true, true);

		VoiceChannelRegistry.JoinResult result = registry.join(SESSION_ID, "conn-2", student(7L));

		assertThat(result.participants()).hasSize(1);
		assertThat(result.participant().micMuted()).isFalse();
		assertThat(result.participant().deafened()).isFalse();
		// 이전 연결(conn-1)이 끊겨도 새 참여(conn-2)는 유지돼야 한다.
		assertThat(registry.disconnect("conn-1")).isEmpty();
		assertThat(registry.isMember(SESSION_ID, 7L)).isTrue();
	}

	@Test
	void leaveRemovesMemberAndReportsRemaining() {
		registry.join(SESSION_ID, "conn-1", student(7L));
		registry.join(SESSION_ID, "conn-2", student(8L));

		Optional<VoiceChannelRegistry.Departure> departure = registry.leave(SESSION_ID, 7L);

		assertThat(departure).isPresent();
		assertThat(departure.get().participant().userId()).isEqualTo(7L);
		assertThat(departure.get().participants())
				.extracting(VoiceParticipantResponse::userId)
				.containsExactly(8L);
	}

	@Test
	void leaveWithoutJoinReturnsEmpty() {
		assertThat(registry.leave(SESSION_ID, 7L)).isEmpty();
	}

	@Test
	void disconnectRemovesAllMembershipsOfConnection() {
		registry.join(SESSION_ID, "conn-1", student(7L));
		registry.join(16L, "conn-1", student(7L));
		registry.join(SESSION_ID, "conn-2", student(8L));

		List<VoiceChannelRegistry.Departure> departures = registry.disconnect("conn-1");

		assertThat(departures).hasSize(2);
		assertThat(registry.isMember(SESSION_ID, 7L)).isFalse();
		assertThat(registry.isMember(16L, 7L)).isFalse();
		assertThat(registry.isMember(SESSION_ID, 8L)).isTrue();
	}

	@Test
	void participantsAreSortedByUserId() {
		registry.join(SESSION_ID, "conn-2", student(9L));
		registry.join(SESSION_ID, "conn-1", student(7L));

		assertThat(registry.participants(SESSION_ID))
				.extracting(VoiceParticipantResponse::userId)
				.containsExactly(7L, 9L);
	}

	private SessionParticipantResponse student(Long userId) {
		return new SessionParticipantResponse(userId, "학생" + userId, "STUDENT");
	}
}
