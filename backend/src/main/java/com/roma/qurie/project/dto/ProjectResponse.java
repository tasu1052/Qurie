package com.roma.qurie.project.dto;

import com.roma.qurie.project.Project;
import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        Long sessionId,
        String path,
        Long importedBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getSessionId(),
                project.getPath(),
                project.getImportedBy(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
