package com.roma.qurie.notice.dto;

import com.roma.qurie.notice.NoticeScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 공지사항 생성 요청. scope 에 따라 trackId/classId 중 필요한 쪽만 채운다.
 * 구조(scope 와 대상 id 의 일관성)는 Notice 엔티티가, 소속 기업 검증은 NoticeService 가 맡는다.
 */
public record NoticeCreateRequest(
        @NotNull NoticeScope scope,
        Long trackId,
        Long classId,
        @NotBlank @Size(max = 200) String title,
        @NotBlank String body,
        boolean pinned) {
}
