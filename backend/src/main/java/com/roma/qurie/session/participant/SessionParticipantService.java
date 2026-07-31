package com.roma.qurie.session.participant;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionParticipantService {

	private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
	private static final String SESSION_NOT_FOUND_MESSAGE = "방을 찾을 수 없습니다.";
	private static final String CLOSED_SESSION_MESSAGE = "종료된 방에는 입장할 수 없습니다.";
	private static final String ENTER_REQUIRED_MESSAGE = "채팅을 보내기 전에 방에 입장해야 합니다.";
	private static final String NOT_CLASS_MEMBER_MESSAGE = "이 반에 소속된 사용자만 입장할 수 있습니다.";

	private final SessionRepository sessionRepository;
	private final SessionPresenceRegistry presenceRegistry;
	private final ClassUserRepository classUserRepository;

	/**
	 * 세션 생성자만 할 수 있는 작업(프로젝트 임포트 등)의 자격 검사.
	 * 입장 자격(반 소속·세션 활성)을 먼저 확인하고 생성자인지 본다.
	 */
	public AuthUser verifySessionCreator(Long sessionId, AuthUser authUser) {
		AuthUser verified = verifyCanEnter(sessionId, authUser);
		Session session = findSession(sessionId);
		if (!session.getCreatedBy().equals(verified.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "세션 생성자만 할 수 있는 작업입니다.");
		}
		return verified;
	}

	/**
	 * 세션이 열린 반의 구성원인지 확인한다. verifyCanEnter 와 달리 세션 활성 여부는 보지 않는다 —
	 * 닫힌 세션의 퀴즈 결과를 매니저가 나중에 확인하는 흐름을 막지 않기 위해서다.
	 */
	public AuthUser verifySessionClassMember(Long sessionId, AuthUser authUser) {
		if (authUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
		}
		Session session = findSession(sessionId);
		verifyClassMember(session.getClassId(), authUser);
		return authUser;
	}

	private Session findSession(Long sessionId) {
		return sessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SESSION_NOT_FOUND_MESSAGE));
	}

	public AuthUser verifyCanEnter(Long sessionId, Principal principal) {
		return verifyCanEnter(sessionId, requireAuthenticated(principal));
	}

	public AuthUser verifyCanEnter(Long sessionId, AuthUser authUser) {
		if (authUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
		}
		Session session = sessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND,
						SESSION_NOT_FOUND_MESSAGE));
		if (!session.isActive()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, CLOSED_SESSION_MESSAGE);
		}
		verifyClassMember(session.getClassId(), authUser);

		return authUser;
	}

	/**
	 * 반 명단에 있는지 확인한다. 매니저도 명단으로 판정하므로 자기 반 밖의 방에는 들어갈 수 없다.
	 * 마스터는 ordinary_users 가 아니라 masters 에 있어 명단에 담기지 않는다 — 방 입장 대상이 아니다.
	 */
	public void verifyClassMember(Long classId, AuthUser authUser) {
		if (authUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
		}
		if (!classUserRepository.existsByClassEntityIdAndUserId(classId, authUser.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_CLASS_MEMBER_MESSAGE);
		}
	}

	public SessionPresenceRegistry.JoinResult enter(
			Long sessionId,
			String connectionId,
			Principal principal) {
		AuthUser authUser = verifyCanEnter(sessionId, principal);
		return presenceRegistry.enter(
				sessionId,
				connectionId,
				SessionParticipantResponse.from(authUser));
	}

	public SessionPresenceRegistry.Departure leave(
			Long sessionId,
			String connectionId,
			Principal principal) {
		AuthUser authUser = requireAuthenticated(principal);
		return presenceRegistry.leave(sessionId, connectionId, authUser.id())
				.orElse(null);
	}

	public void verifyPresent(
			Long sessionId,
			String connectionId,
			Long userId) {
		if (!presenceRegistry.isPresent(sessionId, connectionId, userId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, ENTER_REQUIRED_MESSAGE);
		}
	}

	public List<SessionParticipantResponse> getParticipants(
			Long sessionId,
			AuthUser authUser) {
		verifyCanEnter(sessionId, authUser);
		return presenceRegistry.participants(sessionId);
	}

	public AuthUser requireAuthenticated(Principal principal) {
		if (principal instanceof Authentication authentication
				&& authentication.getPrincipal() instanceof AuthUser authUser) {
			return authUser;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
	}
}
