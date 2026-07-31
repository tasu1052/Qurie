package com.roma.qurie.session.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.ChatService;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import com.roma.qurie.session.core.dto.SessionUpdateRequest;
import java.util.Optional;
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

	@Mock
	private ChatService chatService;

	@InjectMocks
	private SessionService sessionService;

	@Test
	void createUsesAuthenticatedUserAsCreator() {
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, "1교시 방", null), CREATOR);

		ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
		verify(sessionRepository).save(captor.capture());
		Session saved = captor.getValue();
		assertThat(saved.getClassId()).isEqualTo(CLASS_ID);
		assertThat(saved.getTitle()).isEqualTo("1교시 방");
		assertThat(saved.getCreatedBy()).isEqualTo(CREATOR.id());
		assertThat(saved.isClassPublic()).isFalse();
		assertThat(response.createdBy()).isEqualTo(CREATOR.id());
	}

	@Test
	void createRejectsUnauthenticatedRequest() {
		assertThatThrownBy(() -> sessionService.create(new SessionCreateRequest(CLASS_ID, "1교시 방", null), null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createOpensClassPublicSessionWhenManagerAndNoneIsOpen() {
		given(sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID)).willReturn(false);
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, "수업 방", true), CREATOR);

		assertThat(response.classPublic()).isTrue();
	}

	@Test
	void createRejectsClassPublicSessionFromStudent() {
		AuthUser student = new AuthUser(20L, "STUDENT", 100L, "student@qurie.com", "학생", CLASS_ID);

		assertThatThrownBy(() -> sessionService.create(new SessionCreateRequest(CLASS_ID, "수업 방", true), student))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createRejectsSecondOpenClassPublicSessionInSameClass() {
		given(sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID)).willReturn(true);

		assertThatThrownBy(() -> sessionService.create(new SessionCreateRequest(CLASS_ID, "수업 방", true), CREATOR))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.CONFLICT);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void closingSessionDeletesItsChatMessages() {
		Session session = new Session(CLASS_ID, "1교시 방", CREATOR.id());
		given(sessionRepository.findById(1L)).willReturn(Optional.of(session));

		sessionService.update(1L, new SessionUpdateRequest(null, false));

		assertThat(session.isActive()).isFalse();
		verify(chatService).deleteBySession(1L);
	}

	@Test
	void renamingSessionKeepsChatMessages() {
		Session session = new Session(CLASS_ID, "1교시 방", CREATOR.id());
		given(sessionRepository.findById(1L)).willReturn(Optional.of(session));

		sessionService.update(1L, new SessionUpdateRequest("2교시 방", null));

		assertThat(session.isActive()).isTrue();
		verify(chatService, never()).deleteBySession(any());
	}

	@Test
	void deletingSessionDeletesItsChatMessages() {
		given(sessionRepository.existsById(1L)).willReturn(true);

		sessionService.delete(1L);

		verify(chatService).deleteBySession(1L);
		verify(sessionRepository).deleteById(1L);
	}

	@Test
	void deletingMissingSessionKeepsChatMessages() {
		given(sessionRepository.existsById(1L)).willReturn(false);

		assertThatThrownBy(() -> sessionService.delete(1L))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
		verify(chatService, never()).deleteBySession(any());
	}

	@Test
	void createAllowsRegularSessionWhileClassPublicSessionIsOpen() {
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, "스터디 방", false), CREATOR);

		assertThat(response.classPublic()).isFalse();
		verify(sessionRepository, never()).existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID);
	}
}
