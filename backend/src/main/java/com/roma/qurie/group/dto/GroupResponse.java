package com.roma.qurie.group.dto;

import com.roma.qurie.group.Group;
import java.time.LocalDateTime;

public record GroupResponse(
        Long id,
        Long classId,
        String name,
        String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static GroupResponse from(Group group) {
        return new GroupResponse(
                group.getId(),
                group.getClassId(),
                group.getName(),
                group.getDescription(),
                group.getStartedAt(),
                group.getEndedAt(),
                group.getCreatedAt(),
                group.getUpdatedAt());
    }
}
