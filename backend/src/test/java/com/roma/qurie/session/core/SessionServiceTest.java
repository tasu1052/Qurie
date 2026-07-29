package com.roma.qurie.session.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

	private static final Long CLASS_ID = 1L;
	private static final AuthUser CREATOR =
			new AuthUser(10L, "MANAGER", 100L, "manager@qurie.com", "매니저", null);

	@Mock
	private SessionRepository sessionRepository;

	@InjectMocks
	private SessionService sessionService;

	@Test
	void createUsesAuthenticatedUserAsCreator() {
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, "1교시 방"), CREATOR);

		ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
		verify(sessionRepository).save(captor.capture());
		Session saved = captor.getValue();
		assertThat(saved.getClassId()).isEqualTo(CLASS_ID);
		assertThat(saved.getTitle()).isEqualTo("1교시 방");
		assertThat(saved.getCreatedBy()).isEqualTo(CREATOR.id());
		assertThat(response.createdBy()).isEqualTo(CREATOR.id());
	}

	@Test
	void createRejectsUnauthenticatedRequest() {
		assertThatThrownBy(() -> sessionService.create(new SessionCreateRequest(CLASS_ID, "1교시 방"), null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
		verify(sessionRepository, never()).save(any(Session.class));
	}
}
