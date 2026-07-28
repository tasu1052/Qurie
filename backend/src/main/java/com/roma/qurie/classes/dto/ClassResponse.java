package com.roma.qurie.classes.dto;

import com.roma.qurie.classes.ClassEntity;
import java.time.LocalDateTime;

public record ClassResponse(
        Long id,
        Long trackId,
        int classNumber,
        String name,
        Integer capacity,
        String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ClassResponse from(ClassEntity classEntity) {
        return new ClassResponse(
                classEntity.getId(),
                classEntity.getTrack().getId(),
                classEntity.getClassNumber(),
                classEntity.getName(),
                classEntity.getCapacity(),
                classEntity.getDescription(),
                classEntity.getStartedAt(),
                classEntity.getEndedAt(),
                classEntity.getCreatedAt(),
                classEntity.getUpdatedAt());
    }
}
