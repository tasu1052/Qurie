package com.roma.qurie.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassUser;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.invitation.Invitation;
import com.roma.qurie.invitation.InvitationService;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.Track;
import com.roma.qurie.user.dto.UserProfileResponse;
import com.roma.qurie.user.dto.UserProfileUpdateRequest;
import com.roma.qurie.user.dto.UserSignUpRequest;
import com.roma.qurie.user.dto.UserSignUpResponse;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

	private static final Long USER_ID = 10L;
	private static final Long ENTERPRISE_ID = 1L;
	private static final Long CLASS_ID = 5L;
	private static final String TOKEN = "invite-token";
	private static final String EMAIL = "manager@qurie.com";
	private static final String NAME = "김태수";
	private static final String RAW_PASSWORD = "password123";
	private static final String ENCODED_PASSWORD = "{bcrypt}encoded";
	private static final String NEW_RAW_PASSWORD = "newPassword123";
	private static final String NEW_ENCODED_PASSWORD = "{bcrypt}newEncoded";

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private InvitationService invitationService;

	@Mock
	private ClassUserRepository classUserRepository;

	@InjectMocks
	private UserService userService;

	@Test
	void signUpTakesEmailAndRoleFromInvitationAndJoinsTheClass() {
		given(invitationService.consume(TOKEN)).willReturn(invitation());
		given(userRepository.existsByEmail(EMAIL)).willReturn(false);
		given(passwordEncoder.encode(RAW_PASSWORD)).willReturn(ENCODED_PASSWORD);
		given(userRepository.save(any(User.class))).willAnswer(invocation -> {
			User user = invocation.getArgument(0);
			ReflectionTestUtils.setField(user, "id", USER_ID);
			return user;
		});

		UserSignUpResponse response = userService.signUp(signUpRequest());

		ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(captor.capture());
		User saved = captor.getValue();
		assertThat(saved.getEmail()).isEqualTo(EMAIL);
		assertThat(saved.getPassword()).isEqualTo(ENCODED_PASSWORD);
		assertThat(saved.getEnterpriseId()).isEqualTo(ENTERPRISE_ID);
		assertThat(saved.getRole()).isEqualTo(UserRole.MANAGER);
		assertThat(saved.getName()).isEqualTo(NAME);

		ArgumentCaptor<ClassUser> classUserCaptor = ArgumentCaptor.forClass(ClassUser.class);
		verify(classUserRepository).save(classUserCaptor.capture());
		ClassUser membership = classUserCaptor.getValue();
		assertThat(membership.getClassEntity().getId()).isEqualTo(CLASS_ID);
		assertThat(membership.getUserId()).isEqualTo(USER_ID);

		assertThat(response.email()).isEqualTo(EMAIL);
		assertThat(response.role()).isEqualTo(UserRole.MANAGER);
		assertThat(response.name()).isEqualTo(NAME);
	}

	@Test
	void signUpThrowsConflictWhenEmailIsAlreadyUsed() {
		given(invitationService.consume(TOKEN)).willReturn(invitation());
		given(userRepository.existsByEmail(EMAIL)).willReturn(true);

		assertThatThrownBy(() -> userService.signUp(signUpRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);

		verify(userRepository, never()).save(any(User.class));
		verify(classUserRepository, never()).save(any(ClassUser.class));
	}

	@Test
	void signUpFailsWhenInvitationIsNotUsable() {
		given(invitationService.consume(TOKEN)).willThrow(
				new ResponseStatusException(HttpStatus.NOT_FOUND, "유효하지 않은 초대입니다."));

		assertThatThrownBy(() -> userService.signUp(signUpRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);

		verify(userRepository, never()).save(any(User.class));
		verify(classUserRepository, never()).save(any(ClassUser.class));
	}

	@Test
	void getProfileReturnsOwnProfile() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

		UserProfileResponse response = userService.getProfile(USER_ID, self());

		assertThat(response.userId()).isEqualTo(USER_ID);
		assertThat(response.email()).isEqualTo(EMAIL);
		assertThat(response.name()).isEqualTo(NAME);
	}

	@Test
	void getProfileThrowsNotFoundWhenUserDoesNotExist() {
		given(userRepository.findById(USER_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> userService.getProfile(USER_ID, self()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void updateProfileChangesNameWithoutTouchingPassword() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

		UserProfileResponse response = userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest("김태수2", null, null), self());

		assertThat(user.getName()).isEqualTo("김태수2");
		assertThat(user.getPassword()).isEqualTo(ENCODED_PASSWORD);
		assertThat(response.name()).isEqualTo("김태수2");
		verify(userRepository).flush();
	}

	@Test
	void updateProfileEncodesNewPasswordWhenCurrentPasswordMatches() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
		given(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).willReturn(true);
		given(passwordEncoder.encode(NEW_RAW_PASSWORD)).willReturn(NEW_ENCODED_PASSWORD);

		userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest(null, RAW_PASSWORD, NEW_RAW_PASSWORD), self());

		assertThat(user.getPassword()).isEqualTo(NEW_ENCODED_PASSWORD);
		assertThat(user.getName()).isEqualTo(NAME);
	}

	@Test
	void updateProfileThrowsBadRequestWhenCurrentPasswordDoesNotMatch() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
		given(passwordEncoder.matches("wrongPassword", ENCODED_PASSWORD)).willReturn(false);

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest(null, "wrongPassword", NEW_RAW_PASSWORD), self()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);

		assertThat(user.getPassword()).isEqualTo(ENCODED_PASSWORD);
	}

	@Test
	void updateProfileThrowsBadRequestWhenNothingToUpdate() {
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(existingUser()));

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest(null, null, null), self()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void updateProfileThrowsBadRequestWhenNameIsBlank() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest("   ", null, null), self()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);

		assertThat(user.getName()).isEqualTo(NAME);
	}

	@Test
	void updateProfileThrowsForbiddenWhenRequesterIsAnotherUser() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
		AuthUser other = new AuthUser(99L, UserRole.STUDENT.name(), ENTERPRISE_ID, "other@qurie.com", "다른사람");

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest("해킹", null, null), other))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		assertThat(user.getName()).isEqualTo(NAME);
	}

	@Test
	void updateProfileThrowsUnauthorizedWhenNotAuthenticated() {
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(existingUser()));

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest("김태수2", null, null), null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void updateProfileAllowsMasterOfSameEnterpriseToResetPasswordWithoutCurrentPassword() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
		given(passwordEncoder.encode(NEW_RAW_PASSWORD)).willReturn(NEW_ENCODED_PASSWORD);

		userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest(null, null, NEW_RAW_PASSWORD), master(ENTERPRISE_ID));

		assertThat(user.getPassword()).isEqualTo(NEW_ENCODED_PASSWORD);
	}

	@Test
	void updateProfileThrowsForbiddenWhenMasterBelongsToAnotherEnterprise() {
		User user = existingUser();
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

		assertThatThrownBy(() -> userService.updateProfile(
				USER_ID, new UserProfileUpdateRequest("김태수2", null, null), master(2L)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(UserServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		assertThat(user.getName()).isEqualTo(NAME);
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}

	private UserSignUpRequest signUpRequest() {
		return new UserSignUpRequest(TOKEN, RAW_PASSWORD, NAME);
	}

	private Invitation invitation() {
		Enterprise enterprise = new Enterprise("SSAFY");
		ReflectionTestUtils.setField(enterprise, "id", ENTERPRISE_ID);
		ClassEntity classEntity = ClassEntity.builder()
				.track(new Track(enterprise, "Java 트랙", null, "JAVA"))
				.classNumber(1)
				.name("서울 1반")
				.build();
		ReflectionTestUtils.setField(classEntity, "id", CLASS_ID);

		return Invitation.byMaster(
				"token-hash",
				EMAIL,
				classEntity,
				UserRole.MANAGER,
				LocalDateTime.now().plusDays(7),
				1L);
	}

	private User existingUser() {
		User user = User.builder()
				.enterpriseId(ENTERPRISE_ID)
				.email(EMAIL)
				.role(UserRole.MANAGER)
				.password(ENCODED_PASSWORD)
				.name(NAME)
				.build();
		ReflectionTestUtils.setField(user, "id", USER_ID);
		return user;
	}

	private AuthUser self() {
		return new AuthUser(USER_ID, UserRole.MANAGER.name(), ENTERPRISE_ID, EMAIL, NAME);
	}

	private AuthUser master(Long enterpriseId) {
		return new AuthUser(1L, "MASTER", enterpriseId, "master@qurie.com", "마스터");
	}
}
