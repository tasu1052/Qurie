package com.roma.qurie.report.dto;

import com.roma.qurie.report.entity.UserReport;

import java.time.LocalDateTime;

public record UserReportCreateResponse(
        Long userReportId,
        Long ordinaryUserId,
        Long classId,
        LocalDateTime issuedAt) {

    public static UserReportCreateResponse from(UserReport userReport) {
        return new UserReportCreateResponse(
                userReport.getId(),
                userReport.getOrdinaryUserId(),
                userReport.getClassId(),
                userReport.getIssuedAt());
    }
}
