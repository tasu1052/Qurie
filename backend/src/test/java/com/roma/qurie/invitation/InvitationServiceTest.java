package com.roma.qurie.invitation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.invitation.dto.InvitationCreateResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.Track;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

	private static final Long ENTERPRISE_ID = 1L;
	private static final Long CLASS_ID = 5L;
	private static final Long MASTER_ID = 100L;
	private static final Long MANAGER_ID = 200L;
	private static final String INVITEE_EMAIL = "invitee@qurie.com";
	private static final String RAW_TOKEN = "raw-token";
	private static final String TOKEN_HASH = "token-hash";

	@Mock
	private InvitationRepository invitationRepository;

	@Mock
	private InvitationTokenProvider tokenProvider;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private InvitationMailSender mailSender;

	@InjectMocks
	private InvitationService invitationService;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(invitationService, "frontendBaseUrl", "http://localhost:5173");
	}

	@Test
	void masterInvitesManagerToClassOfOwnEnterprise() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);
		given(tokenProvider.hash(RAW_TOKEN)).willReturn(TOKEN_HASH);
		given(invitationRepository.save(any(Invitation.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		InvitationCreateResponse response = invitationService.create(
				master(ENTERPRISE_ID), request(UserRole.MANAGER));

		ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
		verify(invitationRepository).save(captor.capture());
		Invitation saved = captor.getValue();
		assertThat(saved.getTokenHash()).isEqualTo(TOKEN_HASH);
		assertThat(saved.getEmail()).isEqualTo(INVITEE_EMAIL);
		assertThat(saved.getRole()).isEqualTo(UserRole.MANAGER);
		assertThat(saved.getInvitedByMasterId()).isEqualTo(MASTER_ID);
		assertThat(saved.getInvitedByUserId()).isNull();
		assertThat(saved.isPending()).isTrue();

		assertThat(response.token()).isEqualTo(RAW_TOKEN);
		assertThat(response.signUpUrl()).isEqualTo("http://localhost:5173/signup?token=raw-token");
		verify(mailSender).send(saved, "http://localhost:5173/signup?token=raw-token");
	}

	@Test
	void createDoesNotSendMailWhenInviteIsRejected() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(true);

		assertThatThrownBy(() -> invitationService.create(master(ENTERPRISE_ID), request(UserRole.MANAGER)))
				.isInstanceOf(ResponseStatusException.class);

		verify(mailSender, never()).send(any(Invitation.class), anyString());
	}

	@Test
	void masterCannotInviteStudent() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);

		assertThatThrownBy(() -> invitationService.create(master(ENTERPRISE_ID), request(UserRole.STUDENT)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(invitationRepository, never()).save(any(Invitation.class));
	}

	@Test
	void masterCannotInviteToAnotherEnterprisesClass() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);

		assertThatThrownBy(() -> invitationService.create(master(99L), request(UserRole.MANAGER)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(invitationRepository, never()).save(any(Invitation.class));
	}

	@Test
	void managerInvitesStudentToOwnClass() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);
		given(tokenProvider.hash(RAW_TOKEN)).willReturn(TOKEN_HASH);
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, MANAGER_ID)).willReturn(true);
		given(invitationRepository.save(any(Invitation.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		invitationService.create(manager(), request(UserRole.STUDENT));

		ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
		verify(invitationRepository).save(captor.capture());
		Invitation saved = captor.getValue();
		assertThat(saved.getRole()).isEqualTo(UserRole.STUDENT);
		assertThat(saved.getInvitedByUserId()).isEqualTo(MANAGER_ID);
		assertThat(saved.getInvitedByMasterId()).isNull();
	}

	@Test
	void managerCannotInviteToClassTheyDoNotBelongTo() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, MANAGER_ID)).willReturn(false);

		assertThatThrownBy(() -> invitationService.create(manager(), request(UserRole.STUDENT)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(invitationRepository, never()).save(any(Invitation.class));
	}

	@Test
	void studentCannotInvite() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(false);
		given(tokenProvider.generateToken()).willReturn(RAW_TOKEN);
		AuthUser student = new AuthUser(300L, UserRole.STUDENT.name(), ENTERPRISE_ID, "s@qurie.com", "학생", null);

		assertThatThrownBy(() -> invitationService.create(student, request(UserRole.STUDENT)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(invitationRepository, never()).save(any(Invitation.class));
	}

	@Test
	void createRejectsAlreadyRegisteredEmail() {
		givenClassExists();
		given(userRepository.existsByEmail(INVITEE_EMAIL)).willReturn(true);

		assertThatThrownBy(() -> invitationService.create(master(ENTERPRISE_ID), request(UserRole.MANAGER)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);

		verify(invitationRepository, never()).save(any(Invitation.class));
	}

	@Test
	void consumeMarksInvitationAccepted() {
		Invitation invitation = pendingInvitation();
		given(tokenProvider.hash(RAW_TOKEN)).willReturn(TOKEN_HASH);
		given(invitationRepository.findByTokenHash(TOKEN_HASH)).willReturn(Optional.of(invitation));

		Invitation consumed = invitationService.consume(RAW_TOKEN);

		assertThat(consumed.getAcceptedAt()).isNotNull();
		assertThat(consumed.isPending()).isFalse();
	}

	@Test
	void consumeRejectsAlreadyAcceptedInvitation() {
		Invitation invitation = pendingInvitation();
		invitation.accept();
		given(tokenProvider.hash(RAW_TOKEN)).willReturn(TOKEN_HASH);
		given(invitationRepository.findByTokenHash(TOKEN_HASH)).willReturn(Optional.of(invitation));

		assertThatThrownBy(() -> invitationService.consume(RAW_TOKEN))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void previewRejectsExpiredInvitation() {
		Invitation expired = Invitation.byMaster(
				TOKEN_HASH,
				INVITEE_EMAIL,
				classEntity(),
				UserRole.MANAGER,
				LocalDateTime.now().minusDays(1),
				MASTER_ID);
		given(tokenProvider.hash(RAW_TOKEN)).willReturn(TOKEN_HASH);
		given(invitationRepository.findByTokenHash(TOKEN_HASH)).willReturn(Optional.of(expired));

		assertThatThrownBy(() -> invitationService.preview(RAW_TOKEN))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(InvitationServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}

	private void givenClassExists() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity()));
	}

	private ClassEntity classEntity() {
		Enterprise enterprise = new Enterprise("SSAFY");
		ReflectionTestUtils.setField(enterprise, "id", ENTERPRISE_ID);
		ClassEntity classEntity = ClassEntity.builder()
				.track(new Track(enterprise, "Java 트랙", null, "JAVA"))
				.classNumber(1)
				.name("서울 1반")
				.build();
		ReflectionTestUtils.setField(classEntity, "id", CLASS_ID);
		return classEntity;
	}

	private Invitation pendingInvitation() {
		return Invitation.byMaster(
				TOKEN_HASH,
				INVITEE_EMAIL,
				classEntity(),
				UserRole.MANAGER,
				LocalDateTime.now().plusDays(7),
				MASTER_ID);
	}

	private InvitationCreateRequest request(UserRole role) {
		return new InvitationCreateRequest(INVITEE_EMAIL, CLASS_ID, role);
	}

	private AuthUser master(Long enterpriseId) {
		return new AuthUser(MASTER_ID, "MASTER", enterpriseId, "master@qurie.com", "마스터", null);
	}

	private AuthUser manager() {
		return new AuthUser(
				MANAGER_ID, UserRole.MANAGER.name(), ENTERPRISE_ID, "manager@qurie.com", "매니저", null);
	}
}
