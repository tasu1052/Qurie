package com.roma.qurie.session;

import com.roma.qurie.session.dto.SessionCreateRequest;
import com.roma.qurie.session.dto.SessionResponse;
import com.roma.qurie.session.dto.SessionUpdateRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    /* 방을 생성하는 함수 */
    @Transactional
    public SessionResponse create(SessionCreateRequest request) {
        Session session =
                new Session(
                        request.classId(),
                        request.title(),
                        request.createdBy());
        return SessionResponse.from(sessionRepository.save(session));
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
        }
        return SessionResponse.from(session);
    }

    @Transactional
    public void delete(Long id) {
        if (!sessionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + id);
        }
        sessionRepository.deleteById(id);
    }

    private Session findByIdOrThrow(Long id) {
        return sessionRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found: " + id));
    }
}
