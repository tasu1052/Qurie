package com.roma.qurie.session.core;

import com.roma.qurie.report.dto.SessionReportBulkResponse;
import com.roma.qurie.report.dto.SessionReportManagerCommentRequest;
import com.roma.qurie.report.dto.SessionReportRosterResponse;
import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportCreateResponse;
import com.roma.qurie.report.dto.SessionReportDetailResponse;
import com.roma.qurie.report.service.SessionReportService;
import com.roma.qurie.session.core.dto.SessionCreateRequest;
import com.roma.qurie.session.core.dto.SessionResponse;
import com.roma.qurie.session.core.dto.SessionUpdateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionReportService sessionReportService;
    private final SessionService sessionService;
    private final SessionParticipantService sessionParticipantService;

    /** 방 생성. 생성자는 요청 본문이 아니라 인증 정보에서 가져오고, 자기가 속한 반에만 만들 수 있다. */
    @PostMapping
    public ResponseEntity<SessionResponse> create(
            @Valid @RequestBody SessionCreateRequest request,
            @AuthenticationPrincipal AuthUser requester) {
        sessionParticipantService.verifyClassMember(request.classId(), requester);
        SessionResponse response = sessionService.create(request, requester);
        return ResponseEntity.created(URI.create("/api/sessions/" + response.id())).body(response);
    }

    /** 방 단건 조회 */
    @GetMapping("/{id}")
    public SessionResponse get(@PathVariable Long id) {
        return sessionService.getSession(id);
    }

    /**
     * 클래스별 세션 목록 조회. 기본은 열린 세션만 주고, activeOnly=false 면 종료된 세션까지 포함한다.
     * 해당 반 소속만 볼 수 있다.
     * userId 를 주면 그 학생 기준(반 공개 + 그 학생 그룹의 세션)으로 거른다 — 본인 외 지정은 매니저/마스터만.
     */
    @GetMapping
    public List<SessionResponse> list(
            @RequestParam Long classId,
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "activeOnly", required = false, defaultValue = "true") boolean activeOnly,
            @AuthenticationPrincipal AuthUser requester) {
        sessionParticipantService.verifyClassMember(classId, requester);
        return sessionService.getSessions(classId, requester, userId, activeOnly);
    }

    @GetMapping("/{id}/participants")
    public List<SessionParticipantResponse> participants(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUser requester) {
        return sessionParticipantService.getParticipants(id, requester);
    }

    /**
     * 방 입장 자격 확인. collab(Yjs) 서버가 WebSocket 핸드셰이크에서 위임 호출한다 —
     * 자격 규칙(반 명단·세션 활성)을 collab 쪽에 복제하지 않기 위한 전용 경로.
     * 통과하면 204, 아니면 verifyCanEnter 의 401/403/404/409 가 그대로 나간다.
     */
    @GetMapping("/{id}/access")
    public ResponseEntity<Void> verifyAccess(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUser requester) {
        sessionParticipantService.verifyCanEnter(id, requester);
        return ResponseEntity.noContent().build();
    }

    /** 방 수정 (제목 변경 / active=false 로 닫기). 강사만 가능. 닫힌 세션은 수정 불가, 재오픈 불가. */
    @PatchMapping("/{id}")
    public SessionResponse update(
            @PathVariable Long id,
            @Valid @RequestBody SessionUpdateRequest request,
            @AuthenticationPrincipal AuthUser requester) {
        return sessionService.update(id, request, requester);
    }

    /** 방 삭제. 강사만 가능. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id, @AuthenticationPrincipal AuthUser requester) {
        sessionService.delete(id, requester);
        return ResponseEntity.noContent().build();
    }

    /**
     * 세션 리포트 발급. 같은 반 강사만 할 수 있고, 이미 발급된 리포트는 새 스냅샷으로 대체된다.
     * 정량 지표(문항 수·정답률 등)는 서버가 quiz_progress 에서 집계한다.
     *
     * @param sessionId: 리포트를 발급할 세션 id
     * @param request: 발급 대상 사용자와 정성 항목(AI 코멘트·평점)
     */
    @PostMapping("{sessionId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionReportCreateResponse createSessionReport(@PathVariable Long sessionId,
                                                           @Valid @RequestBody SessionReportCreateRequest request,
                                                           @AuthenticationPrincipal AuthUser requester) {
        return sessionReportService.createSessionReport(sessionId, request, requester);
    }

    /**
     * 세션 참여 학생 전원의 리포트 일괄 발급 — 접수 즉시 202 로 응답하고 발급은 백그라운드에서 진행된다.
     * 같은 반 강사만 할 수 있다. 완료는 앱 알림으로 전달되고, 발급 중 재요청은 409 로 거절된다.
     * (동기 응답이던 시절 학생 수 × AI 호출 시간이 게이트웨이 30초를 넘겨 504 가 났다.)
     */
    @PostMapping("{sessionId}/reports/all")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public SessionReportBulkResponse createSessionReportsForAll(@PathVariable Long sessionId,
                                                                @AuthenticationPrincipal AuthUser requester) {
        return sessionReportService.createSessionReportsForAll(sessionId, requester);
    }

    /** 세션에 발급된 학생 리포트 전체 명단. 같은 반 강사만 조회. */
    @GetMapping("{sessionId}/reports/roster")
    public SessionReportRosterResponse listSessionReportRoster(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal AuthUser requester) {
        return sessionReportService.listSessionReportRoster(sessionId, requester);
    }

    /**
     * 세션 리포트 조회. userId 없으면 본인, 있으면 해당 학생(같은 반 매니저·마스터 또는 본인).
     */
    @GetMapping("{sessionId}/reports")
    public SessionReportDetailResponse getSessionReport(
            @PathVariable Long sessionId,
            @RequestParam(name = "userId", required = false) Long userId,
            @AuthenticationPrincipal AuthUser requester) {
        return sessionReportService.getSessionReport(sessionId, userId, requester);
    }

    /** 강사가 학생 세션 리포트에 코멘트를 남긴다. */
    @PatchMapping("{sessionId}/reports/{userId}/manager-comment")
    public SessionReportDetailResponse updateManagerComment(
            @PathVariable Long sessionId,
            @PathVariable Long userId,
            @Valid @RequestBody SessionReportManagerCommentRequest request,
            @AuthenticationPrincipal AuthUser requester) {
        return sessionReportService.updateManagerComment(sessionId, userId, request, requester);
    }
}
