package com.roma.qurie.project.dto;

import com.roma.qurie.project.Project;
import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        Long sessionId,
        String path,
        Long importedBy,
        String versionHash,
        int fileCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ProjectResponse from(Project project) {
        return from(project, null, 0);
    }

    public static ProjectResponse from(Project project, String versionHash, int fileCount) {
        return new ProjectResponse(
                project.getId(),
                project.getSessionId(),
                project.getPath(),
                project.getImportedBy(),
                versionHash,
                fileCount,
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
