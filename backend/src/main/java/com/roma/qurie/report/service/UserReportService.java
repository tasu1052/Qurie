package com.roma.qurie.report.service;

import com.roma.qurie.report.dto.UserReportCreateRequest;
import com.roma.qurie.report.dto.UserReportCreateResponse;
import com.roma.qurie.report.entity.UserReport;
import com.roma.qurie.report.repository.UserReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserReportService {

    private final UserReportRepository userReportRepository;

    @Transactional
    public UserReportCreateResponse createUserReport(Long ordinaryUserId, UserReportCreateRequest request) {
        if (userReportRepository.existsByOrdinaryUserIdAndClassId(ordinaryUserId, request.classId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 발급된 최종 리포트가 있습니다.");
        }

        UserReport userReport = UserReport.builder()
                .ordinaryUserId(ordinaryUserId)
                .classId(request.classId())
                .sessionCount(request.sessionCount())
                .quizTotalCount(request.quizTotalCount())
                .quizAttemptedCount(request.quizAttemptedCount())
                .quizCorrectCount(request.quizCorrectCount())
                .quizSkippedCount(request.quizSkippedCount())
                .completionRate(request.completionRate())
                .accuracy(request.accuracy())
                .avgElapsedMs(request.avgElapsedMs())
                .difficultyRatio(request.difficultyRatio())
                .conceptStats(request.conceptStats())
                .rating(request.rating())
                .ratingFormulaVersion(request.ratingFormulaVersion())
                .issuedAt(LocalDateTime.now())
                .build();

        return UserReportCreateResponse.from(userReportRepository.save(userReport));
    }
}
