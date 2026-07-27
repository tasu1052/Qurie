package com.roma.qurie.report.service;

import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportCreateResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SessionReportService {

    private final SessionReportRepository sessionReportRepository;

    @Transactional
    public SessionReportCreateResponse createSessionReport(Long sessionId, SessionReportCreateRequest request) {
        if (sessionReportRepository.existsBySessionIdAndOrdinaryUserId(sessionId, request.ordinaryUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 발급된 세션 리포트가 있습니다.");
        }

        SessionReport sessionReport = SessionReport.builder()
                .sessionId(sessionId)
                .ordinaryUserId(request.ordinaryUserId())
                .quizSetId(request.quizSetId())
                .quizTotalCount(request.quizTotalCount())
                .quizAttemptedCount(request.quizAttemptedCount())
                .quizCorrectCount(request.quizCorrectCount())
                .quizSkippedCount(request.quizSkippedCount())
                .completionRate(request.completionRate())
                .accuracy(request.accuracy())
                .avgElapsedMs(request.avgElapsedMs())
                .difficultyRatio(request.difficultyRatio())
                .conceptStats(request.conceptStats())
                .quizRating(request.quizRating())
                .aiComment(request.aiComment())
                .aiStrengths(request.aiStrengths())
                .aiImprovements(request.aiImprovements())
                .issuedAt(LocalDateTime.now())
                .build();

        return SessionReportCreateResponse.from(sessionReportRepository.save(sessionReport));
    }
}
