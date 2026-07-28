package com.roma.qurie.user.service;

import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.ClassUser;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.invitation.Invitation;
import com.roma.qurie.invitation.InvitationService;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.dto.UserProfileResponse;
import com.roma.qurie.user.dto.UserProfileUpdateRequest;
import com.roma.qurie.user.dto.UserSignUpRequest;
import com.roma.qurie.user.dto.UserSignUpResponse;
import com.roma.qurie.user.dto.UserSummaryResponse;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

	private static final String MASTER_ROLE = "MASTER";
	private static final String DUPLICATE_EMAIL_MESSAGE = "이미 사용 중인 이메일입니다.";
	private static final String USER_NOT_FOUND_MESSAGE = "사용자를 찾을 수 없습니다.";
	private static final String FORBIDDEN_MESSAGE = "본인 또는 소속 기업의 마스터만 접근할 수 있습니다.";
	private static final int MAX_PAGE_SIZE = 100;
	private static final int ACTIVITY_WINDOW_DAYS = 7;

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final InvitationService invitationService;
	private final ClassUserRepository classUserRepository;

	/**
	 * 초대 기반 회원가입. 이메일·역할·소속 반은 요청이 아니라 초대에서 읽고,
	 * 가입과 동시에 해당 반 명단(class_users)에 넣는다 — 명단에 없으면 방을 만들지도 입장하지도 못한다.
	 */
	@Transactional
	public UserSignUpResponse signUp(UserSignUpRequest request) {
		Invitation invitation = invitationService.consume(request.token());
		if (userRepository.existsByEmail(invitation.getEmail())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_EMAIL_MESSAGE);
		}

		User user = User.builder()
				.enterpriseId(invitation.enterpriseId())
				.email(invitation.getEmail())
				.role(invitation.getRole())
				.password(passwordEncoder.encode(request.password()))
				.name(request.name())
				.build();

		User saved;
		try {
			saved = userRepository.save(user);
		} catch (DataIntegrityViolationException e) {
			// 중복 확인과 저장 사이에 같은 이메일이 먼저 저장되면 unique 제약으로만 걸러진다.
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_EMAIL_MESSAGE, e);
		}
		classUserRepository.save(new ClassUser(invitation.getClassEntity(), saved.getId()));

		return UserSignUpResponse.from(saved);
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

	/**
	 * 회원 목록 조회. 마스터 대시보드의 매니저 활동 카드도 role=MANAGER, size=3 으로 같은 조회를 잘라 쓴다.
	 *
	 * todo: 활동량을 최근 7일 세션 운영 횟수로만 계산한다. 목업의 "리포트 N건 발급"까지 넣으려면
	 *       session_reports 에 발급자 컬럼이 필요하다.
	 */
	@Transactional(readOnly = true)
	public PageResponse<UserSummaryResponse> getUserSummaries(
			AuthUser requester, UserRole role, String keyword, Pageable pageable) {
		requireMaster(requester);

		LocalDateTime activitySince = LocalDateTime.now().minusDays(ACTIVITY_WINDOW_DAYS);
		Page<UserSummaryResponse> summaries = userRepository.findSummaries(
				requester.enterpriseId(), role, blankToNull(keyword), activitySince, toPageRequest(pageable));

		return PageResponse.from(summaries);
	}

	private void requireMaster(AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (!isMaster(requester)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "회원 목록을 조회할 권한이 없습니다.");
		}
	}

	/*
	 * Sort 는 일부러 버린다. findSummaries 쿼리에 order by 가 이미 있어서 Pageable 의 Sort 를 그대로 넘기면
	 * Spring Data 가 order by 를 덧붙이는데, activity 는 매핑된 속성이 아니라 그 시점에 쿼리가 깨진다.
	 */
	private PageRequest toPageRequest(Pageable pageable) {
		int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
		return PageRequest.of(pageable.getPageNumber(), pageSize);
	}

	/* 빈 문자열이 그대로 들어오면 아무것도 맞지 않는 조건이 되므로 null 로 바꾼다. */
	private String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value;
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
