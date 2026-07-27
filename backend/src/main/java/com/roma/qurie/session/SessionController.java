package com.roma.qurie.session;

import com.roma.qurie.session.dto.SessionCreateRequest;
import com.roma.qurie.session.dto.SessionResponse;
import com.roma.qurie.session.dto.SessionUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /** 방 생성 */
    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SessionCreateRequest request) {
        SessionResponse response = sessionService.create(request);
        return ResponseEntity.created(URI.create("/api/session/" + response.id())).body(response);
    }

    /** 방 단건 조회 */
    @GetMapping("/{id}")
    public SessionResponse get(@PathVariable Long id) {
        return sessionService.getSession(id);
    }

    /** 클래스별 열린 세션 목록 조회. 닫힌 세션은 제외된다. */
    @GetMapping
    public List<SessionResponse> list(@RequestParam Long classId) {
        return sessionService.getOpenSessions(classId);
    }

    /** 방 수정 (제목 변경 / active=false 로 닫기). 닫힌 세션은 수정 불가, 재오픈 불가. */
    @PatchMapping("/{id}")
    public SessionResponse update(
            @PathVariable Long id, @Valid @RequestBody SessionUpdateRequest request) {
        return sessionService.update(id, request);
    }

    /** 방 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
