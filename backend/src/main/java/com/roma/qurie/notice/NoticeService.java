package com.roma.qurie.notice;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.enterprise.EnterpriseRepository;
import com.roma.qurie.notice.dto.NoticeCreateRequest;
import com.roma.qurie.notice.dto.NoticeDetailResponse;
import com.roma.qurie.notice.dto.NoticeResponse;
import com.roma.qurie.notice.dto.NoticeUpdateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private static final String MASTER_ROLE = "MASTER";
    private static final int MAX_PAGE_SIZE = 100;

    private final NoticeRepository noticeRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final TrackRepository trackRepository;
    private final ClassRepository classRepository;

    /**
     * 공지 목록을 조회하는 함수. 마스터 대시보드의 공지 카드도 size 로 상위 N개만 잘라 쓴다.
     *
     * @param forAudience true 이면 매니저·학생용: 기업 전체 + 내 트랙 + 내 반 CLASS 만.
     *                    classId 등호 필터만 쓰면 MASTER 가 올린 ENTERPRISE/TRACK 공지가 빠진다.
     */
    @Transactional(readOnly = true)
    public PageResponse<NoticeResponse> getNotices(
            AuthUser requester,
            NoticeScope scope,
            Long trackId,
            Long classId,
            boolean forAudience,
            Pageable pageable) {
        requireAuthenticated(requester);

        if (forAudience) {
            return PageResponse.from(findAudienceNotices(requester, scope, classId, pageable));
        }

        Page<NoticeResponse> notices =
                noticeRepository.findNotices(
                        requester.enterpriseId(),
                        scope,
                        trackId,
                        classId,
                        NoticeAuthorType.MASTER,
                        NoticeAuthorType.MANAGER,
                        toPageRequest(pageable));

        return PageResponse.from(notices);
    }

    private Page<NoticeResponse> findAudienceNotices(
            AuthUser requester, NoticeScope scope, Long classIdParam, Pageable pageable) {
        Long classId = classIdParam != null ? classIdParam : requester.classId();
        if (classId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오디언스 조회에는 클래스 정보가 필요합니다.");
        }

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다."));
        if (!classEntity.getTrack().getEnterprise().getId().equals(requester.enterpriseId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 클래스 공지는 조회할 수 없습니다.");
        }
        // 매니저·학생은 자기 반만. 마스터가 forAudience 로 조회할 일은 드물지만 기업 일치만 본다.
        if (!isMaster(requester) && requester.classId() != null && !requester.classId().equals(classId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "담당 클래스 공지만 조회할 수 있습니다.");
        }

        Long trackId = classEntity.getTrack().getId();
        return noticeRepository.findAudienceNotices(
                requester.enterpriseId(),
                scope,
                trackId,
                classId,
                NoticeAuthorType.MASTER,
                NoticeAuthorType.MANAGER,
                toPageRequest(pageable));
    }

    /**
     * 공지사항 생성.
     * 마스터는 ENTERPRISE·TRACK·CLASS 범위로 작성하고,
     * 매니저는 자기 반(CLASS) 공지만 작성할 수 있다.
     */
    @Transactional
    public NoticeDetailResponse create(AuthUser requester, NoticeCreateRequest request) {
        NoticeAuthorType authorType = resolveAuthorTypeForCreate(requester, request);
        verifyTargetOwnership(requester, request.scope(), request.trackId(), request.classId());

        Enterprise enterprise = enterpriseRepository.findById(requester.enterpriseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "기업을 찾을 수 없습니다."));

        Notice notice = Notice.builder()
                .enterprise(enterprise)
                .scope(request.scope())
                .trackId(request.trackId())
                .classId(request.classId())
                .title(request.title())
                .body(request.body())
                .pinned(request.pinned())
                .createdBy(requester.id())
                .createdByType(authorType)
                .build();

        return NoticeDetailResponse.from(noticeRepository.save(notice));
    }

    private NoticeAuthorType resolveAuthorTypeForCreate(AuthUser requester, NoticeCreateRequest request) {
        requireAuthenticated(requester);
        if (isMaster(requester)) {
            return NoticeAuthorType.MASTER;
        }
        if ("MANAGER".equals(requester.role())) {
            if (request.scope() != NoticeScope.CLASS) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "매니저는 클래스 공지만 작성할 수 있습니다.");
            }
            Long classId = requester.classId();
            if (classId == null || request.classId() == null || !classId.equals(request.classId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "담당 클래스 공지만 작성할 수 있습니다.");
            }
            return NoticeAuthorType.MANAGER;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "공지사항을 생성할 권한이 없습니다.");
    }

    /** 공지사항 수정. PATCH(부분 수정) 계약이라 보낸 항목만 반영한다. */
    @Transactional
    public NoticeDetailResponse update(AuthUser requester, Long noticeId, NoticeUpdateRequest request) {
        Notice notice = findNoticeInEnterprise(requester, noticeId);
        verifyAuthorOrMaster(requester, notice);

        if (!request.hasAnyField()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 항목이 없습니다.");
        }
        if (request.hasTitle()) {
            notice.changeTitle(request.title());
        }
        if (request.hasBody()) {
            notice.changeBody(request.body());
        }
        if (request.hasPinned()) {
            notice.changePinned(request.pinned());
        }

        return NoticeDetailResponse.from(notice);
    }

    @Transactional
    public void delete(AuthUser requester, Long noticeId) {
        Notice notice = findNoticeInEnterprise(requester, noticeId);
        verifyAuthorOrMaster(requester, notice);

        noticeRepository.delete(notice);
    }

    /* 트랙·클래스가 요청자의 기업 소속인지 확인한다 — 다른 기업의 트랙·반에 공지를 꽂을 수 없게 막는다. */
    private void verifyTargetOwnership(AuthUser requester, NoticeScope scope, Long trackId, Long classId) {
        switch (scope) {
            case TRACK -> {
                Track track = trackRepository.findById(trackId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "트랙을 찾을 수 없습니다."));
                if (!track.getEnterprise().getId().equals(requester.enterpriseId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 트랙에는 공지를 만들 수 없습니다.");
                }
            }
            case CLASS -> {
                ClassEntity classEntity = classRepository.findById(classId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다."));
                if (!classEntity.getTrack().getEnterprise().getId().equals(requester.enterpriseId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 클래스에는 공지를 만들 수 없습니다.");
                }
            }
            case ENTERPRISE -> {
            }
        }
    }

    /* 다른 기업의 공지는 존재 여부도 숨기기 위해 403이 아니라 404로 응답한다 (ClassService 와 같은 정책). */
    private Notice findNoticeInEnterprise(AuthUser requester, Long noticeId) {
        requireAuthenticated(requester);
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));
        if (!notice.getEnterprise().getId().equals(requester.enterpriseId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
        }
        return notice;
    }

    /*
     * 작성자 본인이거나(같은 id + 같은 타입) 소속 기업의 MASTER면 수정·삭제할 수 있다.
     * 작성자는 지금 항상 MASTER 지만, 매니저 발신이 추가돼도 이 검사는 그대로 쓸 수 있게 타입까지 비교한다.
     */
    private void verifyAuthorOrMaster(AuthUser requester, Notice notice) {
        if (isMaster(requester)) {
            return;
        }
        boolean isAuthor = notice.getCreatedBy().equals(requester.id())
                && notice.getCreatedByType().name().equals(requester.role());
        if (!isAuthor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자 또는 마스터만 수정·삭제할 수 있습니다.");
        }
    }

    private boolean isMaster(AuthUser requester) {
        return MASTER_ROLE.equals(requester.role());
    }

    private void requireAuthenticated(AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
    }

    /*
     * Sort 는 일부러 버린다. findNotices 쿼리에 order by 가 이미 있어서 Pageable 의 Sort 를 그대로 넘기면
     * Spring Data 가 order by 를 덧붙여 정렬이 두 번 지정된다.
     */
    private PageRequest toPageRequest(Pageable pageable) {
        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), pageSize);
    }
}
