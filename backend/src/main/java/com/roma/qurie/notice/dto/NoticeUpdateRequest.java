package com.roma.qurie.notice.dto;

import jakarta.validation.constraints.Size;

/**
 * 공지사항 수정 요청. PATCH(부분 수정) 계약이라 보낸 항목만 반영한다.
 * scope·대상(trackId/classId)은 변경을 지원하지 않는다 — 대상을 바꾸려면 새로 작성해야 한다.
 */
public record NoticeUpdateRequest(
        @Size(max = 200) String title,
        String body,
        Boolean pinned) {

    public boolean hasTitle() {
        return title != null;
    }

    public boolean hasBody() {
        return body != null;
    }

    public boolean hasPinned() {
        return pinned != null;
    }

    public boolean hasAnyField() {
        return hasTitle() || hasBody() || hasPinned();
    }
}
