package com.roma.qurie.session.participant;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class SessionWebSocketAuthorizationInterceptor implements ChannelInterceptor {

	private static final Pattern SESSION_TOPIC_PATTERN =
			Pattern.compile("^/topic/sessions/(\\d+)/(messages|participants)$");
	private static final Pattern SESSION_APPLICATION_PATTERN =
			Pattern.compile("^/app/sessions/(\\d+)/(messages|enter|leave)$");
	private static final String ERROR_DESTINATION = "/user/queue/errors";

	private final SessionParticipantService participantService;

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
		StompCommand command = accessor.getCommand();
		if (command == null) {
			return message;
		}

		if (StompCommand.CONNECT.equals(command)) {
			participantService.requireAuthenticated(accessor.getUser());
		}
		if (StompCommand.SUBSCRIBE.equals(command)) {
			verifySubscription(accessor.getDestination(), accessor.getUser());
		}
		if (StompCommand.SEND.equals(command)) {
			verifySend(accessor.getDestination(), accessor.getUser());
		}
		return message;
	}

	private void verifySubscription(String destination, Principal principal) {
		if (ERROR_DESTINATION.equals(destination)) {
			return;
		}
		Matcher matcher = SESSION_TOPIC_PATTERN.matcher(requireDestination(destination));
		if (!matcher.matches()) {
			throw forbiddenDestination();
		}
		participantService.verifyCanEnter(Long.valueOf(matcher.group(1)), principal);
	}

	private void verifySend(String destination, Principal principal) {
		Matcher matcher = SESSION_APPLICATION_PATTERN.matcher(requireDestination(destination));
		if (!matcher.matches()) {
			throw forbiddenDestination();
		}
		if ("leave".equals(matcher.group(2))) {
			participantService.requireAuthenticated(principal);
			return;
		}
		participantService.verifyCanEnter(Long.valueOf(matcher.group(1)), principal);
	}

	private String requireDestination(String destination) {
		if (destination == null) {
			throw forbiddenDestination();
		}
		return destination;
	}

	private ResponseStatusException forbiddenDestination() {
		return new ResponseStatusException(
				HttpStatus.FORBIDDEN,
				"허용되지 않은 실시간 목적지입니다.");
	}
}
