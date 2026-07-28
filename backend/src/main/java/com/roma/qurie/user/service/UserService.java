package com.roma.qurie.user.service;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.dto.UserProfileResponse;
import com.roma.qurie.user.dto.UserProfileUpdateRequest;
import com.roma.qurie.user.dto.UserSignUpRequest;
import com.roma.qurie.user.dto.UserSignUpResponse;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

	private static final String MASTER_ROLE = "MASTER";
	private static final String DUPLICATE_EMAIL_MESSAGE = "이미 사용 중인 이메일입니다.";
	private static final String USER_NOT_FOUND_MESSAGE = "사용자를 찾을 수 없습니다.";
	private static final String FORBIDDEN_MESSAGE = "본인 또는 소속 기업의 마스터만 접근할 수 있습니다.";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	/**
	 * todo: enterpriseId 가 실제로 존재하는 기업인지 검증하지 않는다. enterprise 도메인에 조회 수단이 생기면 검증을 추가한다.
	 */
	@Transactional
	public UserSignUpResponse signUp(UserSignUpRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_EMAIL_MESSAGE);
		}

		User user = User.builder()
				.enterpriseId(request.enterpriseId())
				.email(request.email())
				.role(request.role())
				.password(passwordEncoder.encode(request.password()))
				.name(request.name())
				.build();

		try {
			return UserSignUpResponse.from(userRepository.save(user));
		} catch (DataIntegrityViolationException e) {
			// 중복 확인과 저장 사이에 같은 이메일이 먼저 저장되면 unique 제약으로만 걸러진다.
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_EMAIL_MESSAGE, e);
		}
	}

	/**
	 * 마이페이지 조회. API 설계에 따라 본인과 소속 기업의 마스터만 볼 수 있다.
	 */
	@Transactional(readOnly = true)
	public UserProfileResponse getProfile(Long userId, AuthUser requester) {
		User user = findUser(userId);
		verifyAccessible(user, requester);

		return UserProfileResponse.from(user);
	}

	/**
	 * 마이페이지 정보 수정. 보낸 항목만 반영하며, 비밀번호를 바꿀 때는 본인 확인을 위해 현재 비밀번호를 함께 받는다.
	 */
	@Transactional
	public UserProfileResponse updateProfile(Long userId, UserProfileUpdateRequest request, AuthUser requester) {
		User user = findUser(userId);
		verifyAccessible(user, requester);

		if (!request.hasName() && !request.hasNewPassword()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 항목이 없습니다.");
		}

		if (request.hasName()) {
			user.updateName(requireNotBlankName(request.name()));
		}

		if (request.hasNewPassword()) {
			verifyCurrentPassword(user, request.currentPassword(), requester);
			user.changePassword(passwordEncoder.encode(request.newPassword()));
		}

		// updatedAt 은 flush 시점에 채워지므로, 응답에 갱신된 값을 담기 위해 먼저 반영한다.
		userRepository.flush();

		return UserProfileResponse.from(user);
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND_MESSAGE));
	}

	private void verifyAccessible(User user, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		boolean accessible = isMaster(requester)
				? user.getEnterpriseId().equals(requester.enterpriseId())
				: user.getId().equals(requester.id());
		if (!accessible) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);
		}
	}

	private void verifyCurrentPassword(User user, String currentPassword, AuthUser requester) {
		if (isMaster(requester)) {
			// 마스터는 대상 사용자의 비밀번호를 알 수 없어 현재 비밀번호 확인을 건너뛴다.
			return;
		}

		if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다.");
		}
	}

	private String requireNotBlankName(String name) {
		String trimmed = name.trim();
		if (trimmed.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 공백일 수 없습니다.");
		}
		return trimmed;
	}

	private boolean isMaster(AuthUser requester) {
		return MASTER_ROLE.equals(requester.role());
	}
}
