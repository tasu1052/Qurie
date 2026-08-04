package com.roma.qurie.session.help;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionHelpRequestService {

	private static final String MANAGER_ROLE = "MANAGER";
	private static final String MASTER_ROLE = "MASTER";

	private final SessionHelpRequestRegistry registry;
	private final SessionRepository sessionRepository;
	private final SessionParticipantService participantService;

	public HelpRequestResponse create(Long sessionId, AuthUser requester) {
		participantService.verifySessionClassMember(sessionId, requester);
		Session session = sessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "세션을 찾을 수 없습니다."));
		SessionHelpRequestRegistry.HelpRequest created = registry.create(
				session.getId(),
				session.getClassId(),
				requester.id(),
				requester.name() != null ? requester.name() : "참가자",
				session.getTitle());
		return HelpRequestResponse.from(created);
	}

	public List<HelpRequestResponse> listForClass(Long classId, AuthUser requester) {
		requireManagerOrMaster(requester);
		participantService.verifyClassMember(classId, requester);
		return registry.listByClassId(classId).stream().map(HelpRequestResponse::from).toList();
	}

	public void dismiss(Long id, AuthUser requester) {
		requireManagerOrMaster(requester);
		registry.dismiss(id);
	}

	private void requireManagerOrMaster(AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		String role = requester.role();
		if (!MANAGER_ROLE.equals(role) && !MASTER_ROLE.equals(role)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "강사만 질문 알림을 볼 수 있습니다.");
		}
	}

	public record HelpRequestResponse(
			long id,
			long sessionId,
			long classId,
			long fromUserId,
			String fromName,
			String sessionTitle,
			Instant createdAt) {
		static HelpRequestResponse from(SessionHelpRequestRegistry.HelpRequest req) {
			return new HelpRequestResponse(
					req.id(),
					req.sessionId(),
					req.classId(),
					req.fromUserId(),
					req.fromName(),
					req.sessionTitle(),
					req.createdAt());
		}
	}
}
