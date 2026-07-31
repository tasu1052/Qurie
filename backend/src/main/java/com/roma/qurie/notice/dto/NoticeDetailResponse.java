package com.roma.qurie.notice.dto;

import com.roma.qurie.notice.Notice;
import com.roma.qurie.notice.NoticeAuthorType;
import com.roma.qurie.notice.NoticeScope;
import java.time.LocalDateTime;

/**
 * 공지사항 생성·수정 응답. 목록 조회(NoticeResponse)와 달리 트랙/클래스명·작성자명 조인이 없다 —
 * 생성·수정 직후에는 방금 입력한 값을 그대로 보여주면 충분하다.
 */
public record NoticeDetailResponse(
        Long id,
        NoticeScope scope,
        Long trackId,
        Long classId,
        String title,
        String body,
        boolean pinned,
        Long createdBy,
        NoticeAuthorType createdByType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static NoticeDetailResponse from(Notice notice) {
        return new NoticeDetailResponse(
                notice.getId(),
                notice.getScope(),
                notice.getTrackId(),
                notice.getClassId(),
                notice.getTitle(),
                notice.getBody(),
                notice.isPinned(),
                notice.getCreatedBy(),
                notice.getCreatedByType(),
                notice.getCreatedAt(),
                notice.getUpdatedAt());
    }
}
