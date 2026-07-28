package com.roma.qurie.invitation;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.invitation.dto.InvitationCreateResponse;
import com.roma.qurie.invitation.dto.InvitationPreviewResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 가입 초대 발급과 소비.
 *
 * 초대 권한은 두 갈래다.
 * - 마스터는 자기 기업 트랙의 반에 매니저를 초대한다.
 * - 매니저는 자기가 속한 반에만 학생을 초대한다.
 *
 * 초대 링크는 메일로 보내고 응답에도 함께 담는다 — SMTP 를 설정하지 않은 환경에서도 수동 전달로 흐름을 이어갈 수 있게 한다.
 */
@Service
@RequiredArgsConstructor
public class InvitationService {

	private static final Duration EXPIRATION = Duration.ofDays(7);
	private static final String MASTER_ROLE = "MASTER";
	private static final String INVALID_TOKEN_MESSAGE = "유효하지 않은 초대입니다.";

	private final InvitationRepository invitationRepository;
	private final InvitationTokenProvider tokenProvider;
	private final ClassRepository classRepository;
	private final ClassUserRepository classUserRepository;
	private final UserRepository userRepository;
	private final InvitationMailSender mailSender;

	@Value("${app.frontend.base-url:http://localhost:5173}")
	private String frontendBaseUrl;

	@Transactional
	public InvitationCreateResponse create(AuthUser inviter, InvitationCreateRequest request) {
		if (inviter == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		ClassEntity classEntity = classRepository.findById(request.classId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다."));
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
		}

		String rawToken = tokenProvider.generateToken();
		LocalDateTime expiresAt = LocalDateTime.now().plus(EXPIRATION);
		Invitation invitation = isMaster(inviter)
				? createByMaster(inviter, classEntity, request, rawToken, expiresAt)
				: createByManager(inviter, classEntity, request, rawToken, expiresAt);

		Invitation saved = invitationRepository.save(invitation);
		String signUpUrl = signUpUrl(rawToken);
		mailSender.send(saved, signUpUrl);

		return InvitationCreateResponse.of(saved, rawToken, signUpUrl);
	}

	@Transactional(readOnly = true)
	public InvitationPreviewResponse preview(String rawToken) {
		return InvitationPreviewResponse.from(findPending(rawToken));
	}

	/**
	 * 가입 시 초대를 사용 처리하고 반환한다. 같은 토큰으로 두 번 가입할 수 없다.
	 */
	@Transactional
	public Invitation consume(String rawToken) {
		Invitation invitation = findPending(rawToken);
		invitation.accept();
		return invitation;
	}

	private Invitation createByMaster(
			AuthUser inviter,
			ClassEntity classEntity,
			InvitationCreateRequest request,
			String rawToken,
			LocalDateTime expiresAt) {
		if (request.role() != UserRole.MANAGER) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "마스터는 매니저만 초대할 수 있습니다.");
		}
		if (!classEntity.getTrack().getEnterprise().getId().equals(inviter.enterpriseId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 반에는 초대할 수 없습니다.");
		}
		return Invitation.byMaster(
				tokenProvider.hash(rawToken),
				request.email(),
				classEntity,
				request.role(),
				expiresAt,
				inviter.id());
	}

	private Invitation createByManager(
			AuthUser inviter,
			ClassEntity classEntity,
			InvitationCreateRequest request,
			String rawToken,
			LocalDateTime expiresAt) {
		if (!UserRole.MANAGER.name().equals(inviter.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "초대할 권한이 없습니다.");
		}
		if (request.role() != UserRole.STUDENT) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "매니저는 학생만 초대할 수 있습니다.");
		}
		if (!classUserRepository.existsByClassEntityIdAndUserId(classEntity.getId(), inviter.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "자신이 속한 반에만 초대할 수 있습니다.");
		}
		return Invitation.byUser(
				tokenProvider.hash(rawToken),
				request.email(),
				classEntity,
				request.role(),
				expiresAt,
				inviter.id());
	}

	/**
	 * 만료·사용 완료·존재하지 않음을 모두 같은 404 로 응답한다 — 토큰을 넣어보며 유효한 초대를 찾아내지 못하게 한다.
	 */
	private Invitation findPending(String rawToken) {
		return invitationRepository.findByTokenHash(tokenProvider.hash(rawToken))
				.filter(Invitation::isPending)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, INVALID_TOKEN_MESSAGE));
	}

	private boolean isMaster(AuthUser inviter) {
		return MASTER_ROLE.equals(inviter.role());
	}

	private String signUpUrl(String rawToken) {
		return frontendBaseUrl + "/signup?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
	}
}
