package com.roma.qurie.session.core;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.Group;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.ChatService;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import com.roma.qurie.session.core.dto.SessionUpdateRequest;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionService {

    private static final String MANAGER_ROLE = "MANAGER";
    private static final String MASTER_ROLE = "MASTER";

    private final SessionRepository sessionRepository;
    private final ChatService chatService;
    private final GroupRepository groupRepository;
    private final GroupParticipantRepository groupParticipantRepository;
    private final ClassUserRepository classUserRepository;

    /*
     * 방을 생성하는 함수. 생성자는 요청 본문이 아니라 인증된 사용자로 고정한다.
     *
     * 세션 생성·수정·삭제 권한은 클래스 강사(MANAGER)에게만 있다. 일반 세션은 그룹 단위로만 열 수 있고,
     * 반 공개(수업) 세션은 반 전체가 대상이라 그룹을 받지 않으며 반마다 하나만 열려 있을 수 있다.
     */
    @Transactional
    public SessionResponse create(SessionCreateRequest request, AuthUser creator) {
        requireManager(creator, "세션은 강사만 만들 수 있습니다.");

        Long groupId = null;
        if (request.isClassPublicRequested()) {
            verifyNoOpenClassPublicSession(request.classId());
        } else {
            groupId = requireGroupOfClass(request.groupId(), request.classId());
        }

        Session session =
                new Session(
                        request.classId(),
                        groupId,
                        request.title(),
                        creator.id(),
                        request.isClassPublicRequested());
        return SessionResponse.from(sessionRepository.save(session));
    }

    /*
     * 검사~저장 사이에 같은 반 공개 세션이 동시에 생기는 레이스는 막지 못한다.
     * MySQL 이 조건부 유니크를 지원하지 않아 DB 제약을 못 걸고, 강사가 반에 한 명이라 실질 위험이 없다.
     */
    private void verifyNoOpenClassPublicSession(Long classId) {
        if (sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(classId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 열려 있는 반 공개 세션이 있습니다. 먼저 닫아 주세요.");
        }
    }

    /** 일반 세션은 그룹 단위로만 열린다. 다른 반의 그룹으로 세션을 만들면 입장 자격 판정이 어긋나므로 함께 검사한다. */
    private Long requireGroupOfClass(Long groupId, Long classId) {
        if (groupId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "세션은 그룹을 지정해야 만들 수 있습니다.");
        }
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "그룹을 찾을 수 없습니다: " + groupId));
        if (!group.getClassId().equals(classId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "그룹이 해당 반에 속하지 않습니다.");
        }
        return groupId;
    }

    private void requireManager(AuthUser authUser, String message) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!MANAGER_ROLE.equals(authUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
    }

    /**
     * 강사라도 자기 반 밖의 세션은 건드릴 수 없다.
     * 토큰의 classId 는 발급 시점 값이고 강사가 여러 반을 맡으면 그중 하나만 담기므로, 반 명단을 직접 조회한다.
     */
    private void requireSameClass(Session session, AuthUser requester) {
        if (!classUserRepository.existsByClassEntityIdAndUserId(session.getClassId(), requester.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 반의 세션은 관리할 수 없습니다.");
        }
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(Long id) {
        return SessionResponse.from(findByIdOrThrow(id));
    }

    /**
     * 특정 클래스의 열린(참여 가능한) 세션 목록을 조회한다.
     * 닫힌 세션은 소멸된 방이므로 목록에서 제외한다.
     *
     * 강사는 반의 모든 세션을 보고, 학생은 입장할 수 있는 것만 본다 — 반 공개 세션과 자기가 속한 그룹의 세션이다.
     * 목록과 입장 자격이 어긋나면 화면에 보이는 세션을 눌렀는데 403 이 나는 상태가 된다.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getOpenSessions(Long classId, AuthUser requester) {
        return getOpenSessions(classId, requester, null);
    }

    /**
     * userId 를 지정하면 그 학생 기준(반 공개 + 그 학생 그룹의 세션)으로 거른다 —
     * 리포트 화면에서 강사가 특정 학생의 참여 대상 세션을 볼 때 쓴다. 본인 외 지정은 매니저/마스터만 가능하다.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getOpenSessions(Long classId, AuthUser requester, Long userId) {
        requireCanListForUser(requester, userId);

        List<Session> openSessions = sessionRepository.findByClassIdAndActive(classId, true);
        if (userId == null && requester != null && MANAGER_ROLE.equals(requester.role())) {
            return openSessions.stream().map(SessionResponse::from).toList();
        }

        Long targetUserId = userId;
        if (targetUserId == null && requester != null) {
            targetUserId = requester.id();
        }
        Set<Long> groupIds = targetUserId == null
                ? Set.of()
                : Set.copyOf(groupParticipantRepository.findGroupIdsByClassIdAndUserId(classId, targetUserId));
        return openSessions.stream()
                .filter(session -> session.getGroupId() == null || groupIds.contains(session.getGroupId()))
                .map(SessionResponse::from)
                .toList();
    }

    private void requireCanListForUser(AuthUser requester, Long userId) {
        if (userId == null || requester == null || userId.equals(requester.id())) {
            return;
        }
        if (!MANAGER_ROLE.equals(requester.role()) && !MASTER_ROLE.equals(requester.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 세션 목록을 조회할 권한이 없습니다.");
        }
    }

    /**
     * 방을 수정한다. null 인 필드는 변경하지 않는다.
     * active=false 는 방을 닫는다(소멸, 되돌릴 수 없음). active=true(재오픈) 는 허용하지 않는다.
     * 이미 닫힌 세션은 수정할 수 없다.
     *
     * 닫기는 채팅까지 함께 지우는 되돌릴 수 없는 조작이라 삭제와 같은 등급으로 보고 강사에게만 허용한다.
     */
    @Transactional
    public SessionResponse update(Long id, SessionUpdateRequest request, AuthUser requester) {
        requireManager(requester, "세션은 강사만 수정할 수 있습니다.");
        Session session = findByIdOrThrow(id);
        requireSameClass(session, requester);
        if (!session.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "닫힌 세션은 수정할 수 없습니다.");
        }
        if (Boolean.TRUE.equals(request.active())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "닫힌 세션은 다시 열 수 없습니다.");
        }
        if (request.title() != null) {
            session.changeTitle(request.title());
        }
        if (Boolean.FALSE.equals(request.active())) {
            session.close();
            // 방이 소멸하면 채팅도 함께 사라진다. 닫은 방은 다시 열 수 없으므로 복구 대상이 아니다.
            chatService.deleteBySession(id);
        }
        return SessionResponse.from(session);
    }

    @Transactional
    public void delete(Long id, AuthUser requester) {
        requireManager(requester, "세션은 강사만 삭제할 수 있습니다.");
        Session session = findByIdOrThrow(id);
        requireSameClass(session, requester);
        // session_chat_messages 는 sessions 를 FK 로 걸지 않아 세션만 지우면 고아 행으로 남는다.
        chatService.deleteBySession(id);
        sessionRepository.delete(session);
    }

    private Session findByIdOrThrow(Long id) {
        return sessionRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + id));
    }
}
