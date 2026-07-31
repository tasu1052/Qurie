package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupParticipantRole;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import java.security.Principal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SessionParticipantServiceTest {

	private static final Long SESSION_ID = 1L;
	private static final Long CLASS_ID = 20L;
	private static final Long GROUP_ID = 5L;
	private static final AuthUser AUTH_USER =
			new AuthUser(10L, "STUDENT", 100L, "student@qurie.com", "학생", null);
	private static final AuthUser MANAGER =
			new AuthUser(11L, "MANAGER", 100L, "manager@qurie.com", "매니저", null);

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private SessionPresenceRegistry presenceRegistry;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private GroupParticipantRepository groupParticipantRepository;

	@InjectMocks
	private SessionParticipantService participantService;

	@Test
	void verifyCanEnterReturnsAuthenticatedUserForActiveSession() {
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, "방", 30L)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, AUTH_USER.id()))
				.willReturn(true);

		AuthUser result = participantService.verifyCanEnter(SESSION_ID, principal());

		assertThat(result).isEqualTo(AUTH_USER);
	}

	@Test
	void verifyCanEnterRejectsClosedSession() {
		Session session = new Session(CLASS_ID, "방", 30L);
		session.close();
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

		assertThatThrownBy(() -> participantService.verifyCanEnter(SESSION_ID, principal()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.CONFLICT);
	}

	@Test
	void verifyCanEnterRejectsUserOutsideTheClass() {
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, "방", 30L)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, AUTH_USER.id()))
				.willReturn(false);

		assertThatThrownBy(() -> participantService.verifyCanEnter(SESSION_ID, principal()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	/* ── 그룹 세션 입장 ────────────────────────────────────────────── */

	@Test
	void verifyCanEnterAllowsGroupMemberIntoGroupSession() {
		givenGroupSession();
		givenClassMember(AUTH_USER, true);
		given(groupParticipantRepository.existsByGroupIdAndUserId(GROUP_ID, AUTH_USER.id())).willReturn(true);

		assertThat(participantService.verifyCanEnter(SESSION_ID, AUTH_USER)).isEqualTo(AUTH_USER);
	}

	@Test
	void verifyCanEnterRejectsStudentOfAnotherGroup() {
		givenGroupSession();
		givenClassMember(AUTH_USER, true);
		given(groupParticipantRepository.existsByGroupIdAndUserId(GROUP_ID, AUTH_USER.id())).willReturn(false);

		assertThatThrownBy(() -> participantService.verifyCanEnter(SESSION_ID, AUTH_USER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	/** 강사는 그룹 구성원이 아니지만 수업을 관리해야 하므로 자기 반의 그룹 세션에는 들어갈 수 있다. */
	@Test
	void verifyCanEnterAllowsManagerWithoutGroupMembership() {
		givenGroupSession();
		givenClassMember(MANAGER, true);

		assertThat(participantService.verifyCanEnter(SESSION_ID, MANAGER)).isEqualTo(MANAGER);
	}

	/* ── 프로젝트 임포트 권한 ──────────────────────────────────────── */

	@Test
	void verifyCanImportProjectAllowsGroupLeader() {
		givenGroupSession();
		givenClassMember(AUTH_USER, true);
		given(groupParticipantRepository.existsByGroupIdAndUserId(GROUP_ID, AUTH_USER.id())).willReturn(true);
		given(groupParticipantRepository.existsByGroupIdAndUserIdAndRole(
				GROUP_ID, AUTH_USER.id(), GroupParticipantRole.LEADER)).willReturn(true);

		assertThat(participantService.verifyCanImportProject(SESSION_ID, AUTH_USER)).isEqualTo(AUTH_USER);
	}

	@Test
	void verifyCanImportProjectRejectsNonLeaderMember() {
		givenGroupSession();
		givenClassMember(AUTH_USER, true);
		given(groupParticipantRepository.existsByGroupIdAndUserId(GROUP_ID, AUTH_USER.id())).willReturn(true);
		given(groupParticipantRepository.existsByGroupIdAndUserIdAndRole(
				GROUP_ID, AUTH_USER.id(), GroupParticipantRole.LEADER)).willReturn(false);

		assertThatThrownBy(() -> participantService.verifyCanImportProject(SESSION_ID, AUTH_USER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	/** 반 공개(수업) 세션은 그룹 리더가 없다 — 강사만 임포트할 수 있다. */
	@Test
	void verifyCanImportProjectRejectsStudentInClassPublicSession() {
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, null, "수업 방", 30L, true)));
		givenClassMember(AUTH_USER, true);

		assertThatThrownBy(() -> participantService.verifyCanImportProject(SESSION_ID, AUTH_USER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void verifyClassMemberRejectsUnauthenticatedRequest() {
		assertThatThrownBy(() -> participantService.verifyClassMember(CLASS_ID, null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void verifySessionClassMemberAllowsMemberOfClosedSession() {
		Session session = new Session(CLASS_ID, "방", 30L);
		session.close();
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, AUTH_USER.id()))
				.willReturn(true);

		AuthUser result = participantService.verifySessionClassMember(SESSION_ID, AUTH_USER);

		assertThat(result).isEqualTo(AUTH_USER);
	}

	@Test
	void requireAuthenticatedRejectsAnonymousPrincipal() {
		assertThatThrownBy(() -> participantService.requireAuthenticated(null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	private Principal principal() {
		return new UsernamePasswordAuthenticationToken(AUTH_USER, null);
	}

	private void givenGroupSession() {
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, GROUP_ID, "그룹 방", 30L, false)));
	}

	private void givenClassMember(AuthUser authUser, boolean member) {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, authUser.id())).willReturn(member);
	}
}
