package com.roma.qurie.session.core.dto;

import com.roma.qurie.session.core.Session;
import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        Long classId,
        /** 그룹 세션이면 그룹 id, 반 공개(수업) 세션이면 null. */
        Long groupId,
        /** 그룹 세션이면 그룹 이름. 반 공개이거나 그룹이 삭제됐으면 null. */
        String groupName,
        String title,
        Long createdBy,
        boolean active,
        boolean classPublic,
        LocalDateTime createdAt,
        LocalDateTime endedAt,
        LocalDateTime updatedAt) {

    public static SessionResponse from(Session session) {
        return from(session, null);
    }

    public static SessionResponse from(Session session, String groupName) {
        return new SessionResponse(
                session.getId(),
                session.getClassId(),
                session.getGroupId(),
                groupName,
                session.getTitle(),
                session.getCreatedBy(),
                session.isActive(),
                session.isClassPublic(),
                session.getCreatedAt(),
                session.getEndedAt(),
                session.getUpdatedAt());
    }
}
