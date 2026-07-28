package com.roma.qurie.track.dto;

import com.roma.qurie.track.Track;
import java.time.LocalDateTime;

public record TrackResponse(
        Long id,
        Long enterpriseId,
        String name,
        String description,
        String tech,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static TrackResponse from(Track track) {
        return new TrackResponse(
                track.getId(),
                track.getEnterprise().getId(),
                track.getName(),
                track.getDescription(),
                track.getTech(),
                track.getCreatedAt(),
                track.getUpdatedAt());
    }
}
