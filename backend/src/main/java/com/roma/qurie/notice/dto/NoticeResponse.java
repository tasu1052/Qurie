package com.roma.qurie.notice.dto;

import com.roma.qurie.notice.NoticeScope;
import java.time.LocalDateTime;

/**
 * 공지 목록 항목. targetName 은 scope 에 따라 트랙명 또는 클래스명이고 ENTERPRISE 공지에서는 null 이다.
 * authorName 은 masters / ordinary_users 중 created_by_type 에 해당하는 쪽에서 가져온다.
 */
public record NoticeResponse(
        Long id,
        NoticeScope scope,
        Long trackId,
        Long classId,
        String targetName,
        String title,
        String body,
        Boolean pinned,
        String authorName,
        LocalDateTime createdAt) {}
