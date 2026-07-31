package com.roma.qurie.session.participant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.roma.qurie.classes.ClassUserRepository;
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
	private static final AuthUser AUTH_USER =
			new AuthUser(10L, "STUDENT", 100L, "student@qurie.com", "학생", null);

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private SessionPresenceRegistry presenceRegistry;

	@Mock
	private ClassUserRepository classUserRepository;

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

	@Test
	void verifyClassMemberRejectsUnauthenticatedRequest() {
		assertThatThrownBy(() -> participantService.verifyClassMember(CLASS_ID, null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void verifySessionCreatorAcceptsTheCreator() {
		AuthUser creator = new AuthUser(30L, "MANAGER", 100L, "manager@qurie.com", "매니저", CLASS_ID);
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, "방", 30L)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, creator.id()))
				.willReturn(true);

		AuthUser result = participantService.verifySessionCreator(SESSION_ID, creator);

		assertThat(result).isEqualTo(creator);
	}

	@Test
	void verifySessionCreatorRejectsOtherClassMember() {
		given(sessionRepository.findById(SESSION_ID))
				.willReturn(Optional.of(new Session(CLASS_ID, "방", 30L)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, AUTH_USER.id()))
				.willReturn(true);

		assertThatThrownBy(() -> participantService.verifySessionCreator(SESSION_ID, AUTH_USER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
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
}
