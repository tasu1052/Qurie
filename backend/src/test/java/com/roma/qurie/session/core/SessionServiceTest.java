package com.roma.qurie.session.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.Group;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.ChatService;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import com.roma.qurie.session.core.dto.SessionStatusNotification;
import com.roma.qurie.session.core.dto.SessionUpdateRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

	private static final Long CLASS_ID = 1L;
	private static final Long GROUP_ID = 7L;
	private static final AuthUser MANAGER =
			new AuthUser(10L, "MANAGER", 100L, "manager@qurie.com", "매니저", CLASS_ID);
	private static final AuthUser STUDENT =
			new AuthUser(20L, "STUDENT", 100L, "student@qurie.com", "학생", CLASS_ID);

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private ChatService chatService;

	@Mock
	private GroupRepository groupRepository;

	@Mock
	private GroupParticipantRepository groupParticipantRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private SimpMessagingTemplate messagingTemplate;

	@InjectMocks
	private SessionService sessionService;

	/* ── 생성 ─────────────────────────────────────────────────────── */

	@Test
	void createGroupSessionUsesAuthenticatedUserAsCreator() {
		givenGroupInClass(GROUP_ID, CLASS_ID);
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, GROUP_ID, "1교시 방", null), MANAGER);

		ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
		verify(sessionRepository).save(captor.capture());
		Session saved = captor.getValue();
		assertThat(saved.getClassId()).isEqualTo(CLASS_ID);
		assertThat(saved.getGroupId()).isEqualTo(GROUP_ID);
		assertThat(saved.getTitle()).isEqualTo("1교시 방");
		assertThat(saved.getCreatedBy()).isEqualTo(MANAGER.id());
		assertThat(saved.isClassPublic()).isFalse();
		assertThat(response.groupId()).isEqualTo(GROUP_ID);
	}

	@Test
	void createRejectsUnauthenticatedRequest() {
		assertThatThrownBy(() ->
				sessionService.create(new SessionCreateRequest(CLASS_ID, GROUP_ID, "1교시 방", null), null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createRejectsSessionFromStudent() {
		assertThatThrownBy(() ->
				sessionService.create(new SessionCreateRequest(CLASS_ID, GROUP_ID, "스터디 방", null), STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createRejectsGroupSessionWithoutGroup() {
		assertThatThrownBy(() ->
				sessionService.create(new SessionCreateRequest(CLASS_ID, null, "스터디 방", null), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createRejectsGroupFromAnotherClass() {
		givenGroupInClass(GROUP_ID, 99L);

		assertThatThrownBy(() ->
				sessionService.create(new SessionCreateRequest(CLASS_ID, GROUP_ID, "스터디 방", null), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createClassPublicSessionTakesNoGroup() {
		given(sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID)).willReturn(false);
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionResponse response =
				sessionService.create(new SessionCreateRequest(CLASS_ID, null, "수업 방", true), MANAGER);

		assertThat(response.classPublic()).isTrue();
		assertThat(response.groupId()).isNull();
		verify(groupRepository, never()).findById(any());
	}

	@Test
	void createRejectsSecondOpenClassPublicSessionInSameClass() {
		given(sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID)).willReturn(true);

		assertThatThrownBy(() ->
				sessionService.create(new SessionCreateRequest(CLASS_ID, null, "수업 방", true), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.CONFLICT);
		verify(sessionRepository, never()).save(any(Session.class));
	}

	@Test
	void createGroupSessionDoesNotCheckClassPublicConflict() {
		givenGroupInClass(GROUP_ID, CLASS_ID);
		given(sessionRepository.save(any(Session.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		sessionService.create(new SessionCreateRequest(CLASS_ID, GROUP_ID, "스터디 방", false), MANAGER);

		verify(sessionRepository, never()).existsByClassIdAndClassPublicTrueAndActiveTrue(CLASS_ID);
	}

	/* ── 수정 · 삭제 ───────────────────────────────────────────────── */

	@Test
	void closingSessionDeletesItsChatMessages() {
		Session session = givenExistingSession();
		givenClassMember(MANAGER);

		sessionService.update(1L, new SessionUpdateRequest(null, false), MANAGER);

		assertThat(session.isActive()).isFalse();
		verify(chatService).deleteBySession(1L);
	}

	@Test
	void closingSessionBroadcastsEndedStatusToSessionTopic() {
		givenExistingSession();
		givenClassMember(MANAGER);

		sessionService.update(1L, new SessionUpdateRequest(null, false), MANAGER);

		ArgumentCaptor<SessionStatusNotification> captor =
				ArgumentCaptor.forClass(SessionStatusNotification.class);
		verify(messagingTemplate).convertAndSend(eq("/topic/sessions/1/status"), captor.capture());
		assertThat(captor.getValue().sessionId()).isEqualTo(1L);
		assertThat(captor.getValue().active()).isFalse();
		assertThat(captor.getValue().endedAt()).isNotNull();
	}

	@Test
	void renamingSessionKeepsChatMessages() {
		Session session = givenExistingSession();
		givenClassMember(MANAGER);

		sessionService.update(1L, new SessionUpdateRequest("2교시 방", null), MANAGER);

		assertThat(session.isActive()).isTrue();
		verify(chatService, never()).deleteBySession(any());
		verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
	}

	@Test
	void studentCannotCloseSession() {
		assertThatThrownBy(() -> sessionService.update(1L, new SessionUpdateRequest(null, false), STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(chatService, never()).deleteBySession(any());
	}

	@Test
	void anonymousCannotDeleteSession() {
		assertThatThrownBy(() -> sessionService.delete(1L, null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
		verify(sessionRepository, never()).delete(any(Session.class));
	}

	@Test
	void managerOfAnotherClassCannotDeleteSession() {
		givenExistingSession();
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, MANAGER.id())).willReturn(false);

		assertThatThrownBy(() -> sessionService.delete(1L, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(chatService, never()).deleteBySession(any());
	}

	@Test
	void deletingSessionDeletesItsChatMessages() {
		Session session = givenExistingSession();
		givenClassMember(MANAGER);

		sessionService.delete(1L, MANAGER);

		verify(chatService).deleteBySession(1L);
		verify(sessionRepository).delete(session);
	}

	@Test
	void deletingMissingSessionKeepsChatMessages() {
		given(sessionRepository.findById(1L)).willReturn(Optional.empty());

		assertThatThrownBy(() -> sessionService.delete(1L, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
		verify(chatService, never()).deleteBySession(any());
	}

	/* ── 목록 ─────────────────────────────────────────────────────── */

	@Test
	void studentSeesOnlyClassPublicAndOwnGroupSessions() {
		given(sessionRepository.findByClassIdAndActive(CLASS_ID, true))
				.willReturn(List.of(
						new Session(CLASS_ID, null, "수업 방", MANAGER.id(), true),
						new Session(CLASS_ID, GROUP_ID, "우리 그룹 방", MANAGER.id(), false),
						new Session(CLASS_ID, 99L, "남의 그룹 방", MANAGER.id(), false)));
		given(groupParticipantRepository.findGroupIdsByClassIdAndUserId(CLASS_ID, STUDENT.id()))
				.willReturn(List.of(GROUP_ID));

		List<SessionResponse> sessions = sessionService.getOpenSessions(CLASS_ID, STUDENT);

		assertThat(sessions).extracting(SessionResponse::title).containsExactly("수업 방", "우리 그룹 방");
	}

	@Test
	void managerSeesEveryOpenSessionOfClass() {
		given(sessionRepository.findByClassIdAndActive(CLASS_ID, true))
				.willReturn(List.of(
						new Session(CLASS_ID, GROUP_ID, "우리 그룹 방", MANAGER.id(), false),
						new Session(CLASS_ID, 99L, "남의 그룹 방", MANAGER.id(), false)));

		List<SessionResponse> sessions = sessionService.getOpenSessions(CLASS_ID, MANAGER);

		assertThat(sessions).hasSize(2);
		verify(groupParticipantRepository, never()).findGroupIdsByClassIdAndUserId(any(), any());
	}

	@Test
	void managerListsSessionsForSpecificStudent() {
		Long targetUserId = 30L;
		given(sessionRepository.findByClassIdAndActive(CLASS_ID, true))
				.willReturn(List.of(
						new Session(CLASS_ID, null, "수업 방", MANAGER.id(), true),
						new Session(CLASS_ID, GROUP_ID, "그 학생 그룹 방", MANAGER.id(), false),
						new Session(CLASS_ID, 99L, "남의 그룹 방", MANAGER.id(), false)));
		given(groupParticipantRepository.findGroupIdsByClassIdAndUserId(CLASS_ID, targetUserId))
				.willReturn(List.of(GROUP_ID));

		List<SessionResponse> sessions = sessionService.getOpenSessions(CLASS_ID, MANAGER, targetUserId);

		assertThat(sessions).extracting(SessionResponse::title).containsExactly("수업 방", "그 학생 그룹 방");
	}

	@Test
	void managerSeesEndedSessionsWhenActiveOnlyIsFalse() {
		Session closed = new Session(CLASS_ID, GROUP_ID, "끝난 방", MANAGER.id(), false);
		closed.close();
		given(sessionRepository.findByClassIdOrderByIdDesc(CLASS_ID))
				.willReturn(List.of(
						new Session(CLASS_ID, GROUP_ID, "열린 방", MANAGER.id(), false),
						closed));

		List<SessionResponse> sessions = sessionService.getSessions(CLASS_ID, MANAGER, null, false);

		assertThat(sessions).extracting(SessionResponse::title).containsExactly("열린 방", "끝난 방");
		verify(sessionRepository, never()).findByClassIdAndActive(any(), anyBoolean());
	}

	@Test
	void studentSeesEndedSessionsOnlyForClassPublicAndOwnGroups() {
		Session endedOwnGroup = new Session(CLASS_ID, GROUP_ID, "끝난 우리 그룹 방", MANAGER.id(), false);
		endedOwnGroup.close();
		Session endedOtherGroup = new Session(CLASS_ID, 99L, "끝난 남의 그룹 방", MANAGER.id(), false);
		endedOtherGroup.close();
		given(sessionRepository.findByClassIdOrderByIdDesc(CLASS_ID))
				.willReturn(List.of(
						new Session(CLASS_ID, null, "수업 방", MANAGER.id(), true),
						endedOwnGroup,
						endedOtherGroup));
		given(groupParticipantRepository.findGroupIdsByClassIdAndUserId(CLASS_ID, STUDENT.id()))
				.willReturn(List.of(GROUP_ID));

		List<SessionResponse> sessions = sessionService.getSessions(CLASS_ID, STUDENT, null, false);

		assertThat(sessions).extracting(SessionResponse::title).containsExactly("수업 방", "끝난 우리 그룹 방");
	}

	@Test
	void studentCannotListSessionsForAnotherUser() {
		assertThatThrownBy(() -> sessionService.getOpenSessions(CLASS_ID, STUDENT, 999L))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	private Session givenExistingSession() {
		Session session = new Session(CLASS_ID, GROUP_ID, "1교시 방", MANAGER.id(), false);
		given(sessionRepository.findById(1L)).willReturn(Optional.of(session));
		return session;
	}

	private void givenClassMember(AuthUser authUser) {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, authUser.id())).willReturn(true);
	}

	private void givenGroupInClass(Long groupId, Long classId) {
		Group group = new Group(classId, "A조", "설명", LocalDateTime.now(), LocalDateTime.now().plusDays(1));
		given(groupRepository.findById(groupId)).willReturn(Optional.of(group));
	}
}
