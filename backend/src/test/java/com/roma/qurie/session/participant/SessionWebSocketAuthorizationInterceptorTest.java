package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.security.AuthUser;
import java.security.Principal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SessionWebSocketAuthorizationInterceptorTest {

	@Mock
	private SessionParticipantService participantService;

	@Mock
	private MessageChannel messageChannel;

	@Mock
	private Principal principal;

	@InjectMocks
	private SessionWebSocketAuthorizationInterceptor interceptor;

	@Test
	void connectRequiresAuthenticatedPrincipal() {
		interceptor.preSend(message(StompCommand.CONNECT, null), messageChannel);

		verify(participantService).requireAuthenticated(principal);
	}

	@Test
	void subscribingSessionTopicVerifiesEntryPermission() {
		interceptor.preSend(
				message(StompCommand.SUBSCRIBE, "/topic/sessions/15/messages"),
				messageChannel);

		verify(participantService).verifyCanEnter(15L, principal);
	}

	@Test
	void subscribingQuizTopicVerifiesEntryPermission() {
		interceptor.preSend(
				message(StompCommand.SUBSCRIBE, "/topic/sessions/15/quiz"),
				messageChannel);

		verify(participantService).verifyCanEnter(15L, principal);
	}

	@Test
	void sendingToQuizDestinationIsRejected() {
		assertThatThrownBy(() -> interceptor.preSend(
				message(StompCommand.SEND, "/app/sessions/15/quiz"),
				messageChannel))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void subscribingVoiceTopicVerifiesEntryPermission() {
		interceptor.preSend(
				message(StompCommand.SUBSCRIBE, "/topic/sessions/15/voice"),
				messageChannel);

		verify(participantService).verifyCanEnter(15L, principal);
	}

	@Test
	void subscribingOwnVoiceSignalTopicIsAllowed() {
		given(participantService.verifyCanEnter(15L, principal)).willReturn(authUser(7L));

		interceptor.preSend(
				message(StompCommand.SUBSCRIBE, "/topic/sessions/15/voice/signal/7"),
				messageChannel);

		verify(participantService).verifyCanEnter(15L, principal);
	}

	@Test
	void subscribingOthersVoiceSignalTopicIsRejected() {
		given(participantService.verifyCanEnter(15L, principal)).willReturn(authUser(7L));

		assertThatThrownBy(() -> interceptor.preSend(
				message(StompCommand.SUBSCRIBE, "/topic/sessions/15/voice/signal/8"),
				messageChannel))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void sendingVoiceJoinVerifiesEntryPermission() {
		interceptor.preSend(
				message(StompCommand.SEND, "/app/sessions/15/voice/join"),
				messageChannel);

		verify(participantService).verifyCanEnter(15L, principal);
	}

	@Test
	void sendingVoiceLeaveRequiresOnlyAuthentication() {
		interceptor.preSend(
				message(StompCommand.SEND, "/app/sessions/15/voice/leave"),
				messageChannel);

		verify(participantService).requireAuthenticated(principal);
		verify(participantService, never()).verifyCanEnter(15L, principal);
	}

	@Test
	void sendingDirectlyToBrokerTopicIsRejected() {
		assertThatThrownBy(() -> interceptor.preSend(
				message(StompCommand.SEND, "/topic/sessions/15/messages"),
				messageChannel))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	private AuthUser authUser(Long id) {
		return new AuthUser(id, "STUDENT", 1L, "user" + id + "@test.com", "사용자" + id, 3L);
	}

	private Message<byte[]> message(StompCommand command, String destination) {
		StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
		accessor.setUser(principal);
		if (destination != null) {
			accessor.setDestination(destination);
		}
		return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
	}
}
