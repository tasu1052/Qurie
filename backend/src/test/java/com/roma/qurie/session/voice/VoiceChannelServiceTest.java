package com.roma.qurie.session.voice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.session.voice.dto.VoiceChannelEventResponse;
import com.roma.qurie.session.voice.dto.VoiceSignalRequest;
import com.roma.qurie.session.voice.dto.VoiceStateUpdateRequest;
import java.security.Principal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class VoiceChannelServiceTest {

	private static final Long SESSION_ID = 15L;

	@Mock
	private SessionParticipantService participantService;

	@Mock
	private Principal principal;

	@Mock
	private Principal otherPrincipal;

	private final VoiceChannelRegistry registry = new VoiceChannelRegistry();

	@Test
	void joinBroadcastsJoinedEventWithRoster() {
		VoiceChannelService service = service();
		given(participantService.verifyCanEnter(SESSION_ID, principal)).willReturn(user(7L));

		VoiceChannelEventResponse event = service.join(SESSION_ID, "conn-1", principal);

		assertThat(event.type()).isEqualTo(VoiceChannelEventResponse.Type.JOINED);
		assertThat(event.participant().userId()).isEqualTo(7L);
		assertThat(event.participants()).hasSize(1);
	}

	@Test
	void joinRequiresRoomPresence() {
		VoiceChannelService service = service();
		given(participantService.verifyCanEnter(SESSION_ID, principal)).willReturn(user(7L));
		willThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "채팅을 보내기 전에 방에 입장해야 합니다."))
				.given(participantService).verifyPresent(SESSION_ID, "conn-1", 7L);

		assertThatThrownBy(() -> service.join(SESSION_ID, "conn-1", principal))
				.isInstanceOf(ResponseStatusException.class);
		assertThat(registry.isMember(SESSION_ID, 7L)).isFalse();
	}

	@Test
	void updateStateWithoutJoinIsForbidden() {
		VoiceChannelService service = service();
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));

		assertThatThrownBy(() -> service.updateState(
				SESSION_ID, principal, new VoiceStateUpdateRequest(true, false)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(VoiceChannelServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void leaveWithoutJoinReturnsNullSoNothingIsBroadcast() {
		VoiceChannelService service = service();
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));

		assertThat(service.leave(SESSION_ID, principal)).isNull();
	}

	@Test
	void relaySignalRequiresSenderInChannel() {
		VoiceChannelService service = service();
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));

		assertThatThrownBy(() -> service.relaySignal(
				SESSION_ID, principal, new VoiceSignalRequest(8L, "offer", "{}")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(VoiceChannelServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void relaySignalRequiresTargetInChannel() {
		VoiceChannelService service = service();
		given(participantService.verifyCanEnter(SESSION_ID, principal)).willReturn(user(7L));
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));
		service.join(SESSION_ID, "conn-1", principal);

		assertThatThrownBy(() -> service.relaySignal(
				SESSION_ID, principal, new VoiceSignalRequest(8L, "offer", "{}")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(VoiceChannelServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void relaySignalToSelfIsRejected() {
		VoiceChannelService service = service();
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));

		assertThatThrownBy(() -> service.relaySignal(
				SESSION_ID, principal, new VoiceSignalRequest(7L, "offer", "{}")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(VoiceChannelServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void relaySignalTargetsRecipientWithSenderId() {
		VoiceChannelService service = service();
		given(participantService.verifyCanEnter(SESSION_ID, principal)).willReturn(user(7L));
		given(participantService.requireAuthenticated(principal)).willReturn(user(7L));
		given(participantService.verifyCanEnter(SESSION_ID, otherPrincipal)).willReturn(user(8L));
		service.join(SESSION_ID, "conn-1", principal);
		service.join(SESSION_ID, "conn-2", otherPrincipal);

		VoiceChannelService.SignalRelay relay = service.relaySignal(
				SESSION_ID, principal, new VoiceSignalRequest(8L, "offer", "{\"sdp\":\"...\"}"));

		assertThat(relay.targetUserId()).isEqualTo(8L);
		assertThat(relay.signal().fromUserId()).isEqualTo(7L);
		assertThat(relay.signal().type()).isEqualTo("offer");
	}

	private VoiceChannelService service() {
		return new VoiceChannelService(participantService, registry);
	}

	private AuthUser user(Long id) {
		return new AuthUser(id, "STUDENT", 1L, "user" + id + "@test.com", "사용자" + id, 3L);
	}

	private static HttpStatus statusOf(Throwable throwable) {
		return (HttpStatus)((ResponseStatusException)throwable).getStatusCode();
	}
}
