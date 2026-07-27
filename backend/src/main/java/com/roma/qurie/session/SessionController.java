package com.roma.qurie.session;

import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportCreateResponse;
import com.roma.qurie.report.service.SessionReportService;
import com.roma.qurie.session.dto.SessionCreateRequest;
import com.roma.qurie.session.dto.SessionResponse;
import com.roma.qurie.session.dto.SessionUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionReportService sessionReportService;
    private final SessionService sessionService;

    /** 방 생성 */
    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SessionCreateRequest request) {
        SessionResponse response = sessionService.create(request);
        return ResponseEntity.created(URI.create("/api/sessions/" + response.id())).body(response);
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

    /**
     * todo: quiz_progress 엔티티가 생기면 집계 수치를 요청 바디로 받지 않고 서버에서 직접 계산해야 한다.
     *
     * @param sessionId: 리포트를 발급할 세션 id
     * @param request: 세션 집계 수치와 AI 코멘트
     */
    @PostMapping("{sessionId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionReportCreateResponse createSessionReport(@PathVariable Long sessionId,
                                                           @Valid @RequestBody SessionReportCreateRequest request) {
        return sessionReportService.createSessionReport(sessionId, request);
    }
}
