package com.roma.qurie.notice;

import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.notice.dto.NoticeResponse;
import com.roma.qurie.security.AuthUser;
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

    private static final int MAX_PAGE_SIZE = 100;

    private final NoticeRepository noticeRepository;

    /**
     * 공지 목록을 조회하는 함수. 마스터 대시보드의 공지 카드도 size 로 상위 N개만 잘라 쓴다.
     *
     * todo: 지금은 요청자의 기업 공지 전체를 돌려준다. 학생·매니저에게 "내 트랙·클래스 공지만" 보이게 하려면
     *       소속을 알 수 있는 class_user 테이블이 필요하다.
     */
    @Transactional(readOnly = true)
    public PageResponse<NoticeResponse> getNotices(
            AuthUser requester, NoticeScope scope, Long trackId, Long classId, Pageable pageable) {
        requireAuthenticated(requester);

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
