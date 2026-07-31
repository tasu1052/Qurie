package com.roma.qurie.session.core;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.chat.ChatService;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import com.roma.qurie.session.core.dto.SessionUpdateRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionService {

    private static final String MANAGER_ROLE = "MANAGER";

    private final SessionRepository sessionRepository;
    private final ChatService chatService;

    /*
     * 방을 생성하는 함수. 생성자는 요청 본문이 아니라 인증된 사용자로 고정한다.
     * 반 공개(수업) 세션은 강사만, 반마다 열려 있는 것 하나만 만들 수 있다.
     */
    @Transactional
    public SessionResponse create(SessionCreateRequest request, AuthUser creator) {
        if (creator == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (request.isClassPublicRequested()) {
            verifyCanOpenClassPublicSession(request.classId(), creator);
        }
        Session session =
                new Session(
                        request.classId(),
                        request.title(),
                        creator.id(),
                        request.isClassPublicRequested());
        return SessionResponse.from(sessionRepository.save(session));
    }

    /*
     * 검사~저장 사이에 같은 반 공개 세션이 동시에 생기는 레이스는 막지 못한다.
     * MySQL 이 조건부 유니크를 지원하지 않아 DB 제약을 못 걸고, 강사가 반에 한 명이라 실질 위험이 없다.
     */
    private void verifyCanOpenClassPublicSession(Long classId, AuthUser creator) {
        if (!MANAGER_ROLE.equals(creator.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "반 공개 세션은 강사만 열 수 있습니다.");
        }
        if (sessionRepository.existsByClassIdAndClassPublicTrueAndActiveTrue(classId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 열려 있는 반 공개 세션이 있습니다. 먼저 닫아 주세요.");
        }
    }

    @Transactional(readOnly = true)
    public SessionResponse getSession(Long id) {
        return SessionResponse.from(findByIdOrThrow(id));
    }

    /**
     * 특정 클래스의 열린(참여 가능한) 세션 목록을 조회한다.
     * 닫힌 세션은 소멸된 방이므로 목록에서 제외한다.
     * (학생은 본인 클래스, 강사는 원하는 클래스의 classId 를 넘긴다. 역할 검증은 인증 도입 후에 진행할 예정)
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getOpenSessions(Long classId) {
        return sessionRepository.findByClassIdAndActive(classId, true).stream()
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * 방을 수정한다. null 인 필드는 변경하지 않는다.
     * active=false 는 방을 닫는다(소멸, 되돌릴 수 없음). active=true(재오픈) 는 허용하지 않는다.
     * 이미 닫힌 세션은 수정할 수 없다.
     */
    @Transactional
    public SessionResponse update(Long id, SessionUpdateRequest request) {
        Session session = findByIdOrThrow(id);
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
    public void delete(Long id) {
        if (!sessionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + id);
        }
        // session_chat_messages 는 sessions 를 FK 로 걸지 않아 세션만 지우면 고아 행으로 남는다.
        chatService.deleteBySession(id);
        sessionRepository.deleteById(id);
    }

    private Session findByIdOrThrow(Long id) {
        return sessionRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + id));
    }
}
