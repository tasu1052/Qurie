package com.roma.qurie.track;

import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.dto.TrackCreateRequest;
import com.roma.qurie.track.dto.TrackResponse;
import com.roma.qurie.track.dto.TrackSummaryResponse;
import com.roma.qurie.track.dto.TrackUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    /** 트랙 생성 (MASTER) */
    @PostMapping
    public ResponseEntity<TrackResponse> create(
            @AuthenticationPrincipal AuthUser authUser, @Valid @RequestBody TrackCreateRequest request) {
        TrackResponse response = trackService.create(authUser, request);
        return ResponseEntity.created(URI.create("/api/tracks/" + response.id())).body(response);
    }

    /**
     * 트랙 목록 조회 (MASTER, MANAGER). 마스터 대시보드의 트랙 현황은 size로 상위 N개만 잘라 쓴다.
     *
     * todo: 정렬은 대시보드가 요구하는 classCount desc로 고정되어 있다. 트랙 목록 화면(1u)에서
     *       다른 정렬 기준이 필요해지면 sort 파라미터를 받도록 확장해야 한다.
     */
    @GetMapping
    public PageResponse<TrackSummaryResponse> list(
            @AuthenticationPrincipal AuthUser authUser,
            // todo: q 파람은 쓰이지 않아 확인 필요
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "tech", required = false) String tech,
            @PageableDefault(size = 20) Pageable pageable) {
        return trackService.getTrackSummaries(authUser, keyword, tech, pageable);
    }

    /** 트랙 상세 조회 (MASTER, MANAGER) */
    @GetMapping("/{trackId}")
    public TrackResponse get(@AuthenticationPrincipal AuthUser authUser, @PathVariable("trackId") Long trackId) {
        return trackService.getTrack(authUser, trackId);
    }

    /** 트랙 수정 (MASTER) — PUT 전체 교체 */
    @PutMapping("/{trackId}")
    public TrackResponse update(@AuthenticationPrincipal AuthUser authUser, @PathVariable("trackId") Long trackId,
            @Valid @RequestBody TrackUpdateRequest request) {
        return trackService.update(authUser, trackId, request);
    }

    /** 트랙 삭제 (MASTER). 하위 클래스가 있으면 409 */
    @DeleteMapping("/{trackId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthUser authUser, @PathVariable("trackId") Long trackId) {
        trackService.delete(authUser, trackId);
        return ResponseEntity.noContent().build();
    }
}
