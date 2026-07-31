package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

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
	void sendingDirectlyToBrokerTopicIsRejected() {
		assertThatThrownBy(() -> interceptor.preSend(
				message(StompCommand.SEND, "/topic/sessions/15/messages"),
				messageChannel))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
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
