package com.roma.qurie.config;

import com.roma.qurie.session.participant.SessionWebSocketAuthorizationInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final String[] allowedOriginPatterns;
	private final SessionWebSocketAuthorizationInterceptor authorizationInterceptor;

	public WebSocketConfig(
			@Value("${app.websocket.allowed-origin-patterns:http://localhost:5173}") String allowedOriginPatterns,
			SessionWebSocketAuthorizationInterceptor authorizationInterceptor) {
		this.allowedOriginPatterns = allowedOriginPatterns.split(",");
		this.authorizationInterceptor = authorizationInterceptor;
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic", "/queue");
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws")
				.setAllowedOriginPatterns(allowedOriginPatterns);
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(authorizationInterceptor);
	}
}
