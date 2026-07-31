package com.roma.qurie.session.participant;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupParticipantRole;
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

	private static final String MANAGER_ROLE = "MANAGER";
	private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
	private static final String SESSION_NOT_FOUND_MESSAGE = "방을 찾을 수 없습니다.";
	private static final String CLOSED_SESSION_MESSAGE = "종료된 방에는 입장할 수 없습니다.";
	private static final String ENTER_REQUIRED_MESSAGE = "채팅을 보내기 전에 방에 입장해야 합니다.";
	private static final String NOT_CLASS_MEMBER_MESSAGE = "이 반에 소속된 사용자만 입장할 수 있습니다.";
	private static final String NOT_GROUP_MEMBER_MESSAGE = "이 세션은 해당 그룹 구성원만 입장할 수 있습니다.";
	private static final String NOT_GROUP_LEADER_MESSAGE = "프로젝트 임포트는 그룹 리더만 할 수 있습니다.";

	private final SessionRepository sessionRepository;
	private final SessionPresenceRegistry presenceRegistry;
	private final ClassUserRepository classUserRepository;
	private final GroupParticipantRepository groupParticipantRepository;

	public AuthUser verifyCanEnter(Long sessionId, Principal principal) {
		return verifyCanEnter(sessionId, requireAuthenticated(principal));
	}

	public AuthUser verifyCanEnter(Long sessionId, AuthUser authUser) {
		if (authUser == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
		}
		Session session = findSessionOrThrow(sessionId);
		if (!session.isActive()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, CLOSED_SESSION_MESSAGE);
		}
		verifyClassMember(session.getClassId(), authUser);
		verifyGroupMember(session, authUser);

		return authUser;
	}

	/**
	 * 그룹 세션은 그 그룹 구성원만 들어갈 수 있다. 반 공개(수업) 세션은 그룹이 없어 반 명단 검사로 끝난다.
	 * 강사는 그룹 구성원이 아니지만 수업을 관리해야 하므로 자기 반의 그룹 세션에는 들어갈 수 있다.
	 */
	private void verifyGroupMember(Session session, AuthUser authUser) {
		if (session.getGroupId() == null || MANAGER_ROLE.equals(authUser.role())) {
			return;
		}
		if (!groupParticipantRepository.existsByGroupIdAndUserId(session.getGroupId(), authUser.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_GROUP_MEMBER_MESSAGE);
		}
	}

	/**
	 * 세션 안에서 프로젝트를 임포트할 수 있는지 확인한다. 임포트는 그룹 전체의 작업 대상을 고정하는
	 * 조작이라 그룹 리더에게만 허용한다 — 반 공개 세션은 리더가 없으므로 강사만 할 수 있다.
	 */
	public AuthUser verifyCanImportProject(Long sessionId, AuthUser authUser) {
		verifyCanEnter(sessionId, authUser);
		if (MANAGER_ROLE.equals(authUser.role())) {
			return authUser;
		}
		Session session = findSessionOrThrow(sessionId);
		if (session.getGroupId() == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_GROUP_LEADER_MESSAGE);
		}
		if (!groupParticipantRepository.existsByGroupIdAndUserIdAndRole(
				session.getGroupId(), authUser.id(), GroupParticipantRole.LEADER)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_GROUP_LEADER_MESSAGE);
		}
		return authUser;
	}

	private Session findSessionOrThrow(Long sessionId) {
		return sessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND,
						SESSION_NOT_FOUND_MESSAGE));
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
