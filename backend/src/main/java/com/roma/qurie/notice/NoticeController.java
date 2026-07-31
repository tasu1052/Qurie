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
     * todo: 정렬은 고정 공지 우선 + 최신순으로 고정되어 있다. 공지사항 화면(1h)에서 다른 정렬이
     *       필요해지면 sort 파라미터를 받도록 확장해야 한다.
     * todo: 클래스 홈(1m)의 includeEnterprise=true(클래스 공지 + 기업 전체 공지 함께 조회)는 아직 없다.
     *
     * @param scope: ENTERPRISE / TRACK / CLASS. 없으면 전체
     */
    @GetMapping
    public PageResponse<NoticeResponse> list(
            @AuthenticationPrincipal AuthUser requester,
            @RequestParam(name = "scope", required = false) NoticeScope scope,
            @RequestParam(name = "trackId", required = false) Long trackId,
            @RequestParam(name = "classId", required = false) Long classId,
            @PageableDefault(size = 20) Pageable pageable) {
        return noticeService.getNotices(requester, scope, trackId, classId, pageable);
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
