package com.roma.qurie.session.core.dto;

import com.roma.qurie.session.core.Session;
import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        Long classId,
        String title,
        Long createdBy,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime endedAt,
        LocalDateTime updatedAt) {

    public static SessionResponse from(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getClassId(),
                session.getTitle(),
                session.getCreatedBy(),
                session.isActive(),
                session.getCreatedAt(),
                session.getEndedAt(),
                session.getUpdatedAt());
    }
}
