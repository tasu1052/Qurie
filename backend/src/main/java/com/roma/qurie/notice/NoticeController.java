package com.roma.qurie.notice;

import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.notice.dto.NoticeCreateRequest;
import com.roma.qurie.notice.dto.NoticeDetailResponse;
import com.roma.qurie.notice.dto.NoticeResponse;
import com.roma.qurie.notice.dto.NoticeUpdateRequest;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 공지 목록 조회. 마스터 대시보드의 공지 카드는 size=5 로 상위 5건만 잘라 쓴다.
     *
     * @param scope ENTERPRISE / TRACK / CLASS. 없으면 전체(또는 오디언스 합집합)
     * @param forAudience true 이면 기업 전체 + 내 트랙 + 내 반 CLASS (매니저·학생 홈/목록용)
     */
    @GetMapping
    public PageResponse<NoticeResponse> list(
            @AuthenticationPrincipal AuthUser requester,
            @RequestParam(name = "scope", required = false) NoticeScope scope,
            @RequestParam(name = "trackId", required = false) Long trackId,
            @RequestParam(name = "classId", required = false) Long classId,
            @RequestParam(name = "forAudience", defaultValue = "false") boolean forAudience,
            @PageableDefault(size = 20) Pageable pageable) {
        return noticeService.getNotices(requester, scope, trackId, classId, forAudience, pageable);
    }

    /** 공지 단건 조회 — 상세 열람. 목록과 같은 NoticeResponse(작성자·대상명 포함). */
    @GetMapping("/{noticeId}")
    public NoticeResponse get(
            @AuthenticationPrincipal AuthUser requester,
            @PathVariable("noticeId") Long noticeId) {
        return noticeService.getNotice(requester, noticeId);
    }

    /** 공지사항 생성 (MASTER) */
    @PostMapping
    public ResponseEntity<NoticeDetailResponse> create(
            @AuthenticationPrincipal AuthUser requester,
            @Valid @RequestBody NoticeCreateRequest request) {
        NoticeDetailResponse response = noticeService.create(requester, request);
        return ResponseEntity.created(URI.create("/api/notices/" + response.id())).body(response);
    }

    /** 공지사항 수정 (작성자 또는 MASTER) — PATCH 부분 수정 */
    @PatchMapping("/{noticeId}")
    public NoticeDetailResponse update(
            @AuthenticationPrincipal AuthUser requester,
            @PathVariable("noticeId") Long noticeId,
            @Valid @RequestBody NoticeUpdateRequest request) {
        return noticeService.update(requester, noticeId, request);
    }

    /** 공지사항 삭제 (작성자 또는 MASTER) */
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthUser requester,
            @PathVariable("noticeId") Long noticeId) {
        noticeService.delete(requester, noticeId);
        return ResponseEntity.noContent().build();
    }
}
