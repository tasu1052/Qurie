package com.roma.qurie.report.service;

import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportCreateResponse;
import com.roma.qurie.report.dto.SessionReportDetailResponse;
import com.roma.qurie.report.dto.SessionReportSummaryResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionReportService {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";

    private final SessionReportRepository sessionReportRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SessionParticipantService sessionParticipantService;

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

    /**
     * 세션 리포트 단건 조회. 본인 리포트이거나, 같은 반 매니저/마스터면 볼 수 있다.
     * userId 가 없으면 요청자 본인 리포트를 반환한다.
     */
    @Transactional(readOnly = true)
    public SessionReportDetailResponse getSessionReport(Long sessionId, Long userId, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        sessionParticipantService.verifySessionClassMember(sessionId, requester);

        Long targetUserId = userId != null ? userId : requester.id();
        if (!canViewUserReport(requester, targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 세션 리포트를 조회할 권한이 없습니다.");
        }

        SessionReport report = sessionReportRepository
                .findBySessionIdAndOrdinaryUserId(sessionId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "세션 리포트를 찾을 수 없습니다."));

        Session session = sessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방을 찾을 수 없습니다."));
        String userName = userRepository.findById(targetUserId).map(User::getName).orElse("알 수 없음");

        return SessionReportDetailResponse.from(report, session.getTitle(), userName);
    }

    /** 사용자의 세션 리포트 목록. 본인 또는 같은 반 매니저/마스터만 조회. */
    @Transactional(readOnly = true)
    public List<SessionReportSummaryResponse> listSessionReports(Long ordinaryUserId, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!canViewUserReport(requester, ordinaryUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "세션 리포트 목록을 조회할 권한이 없습니다.");
        }

        List<SessionReport> reports =
                sessionReportRepository.findByOrdinaryUserIdOrderByIssuedAtDesc(ordinaryUserId);
        if (reports.isEmpty()) {
            return List.of();
        }

        List<Long> sessionIds = reports.stream().map(SessionReport::getSessionId).distinct().toList();
        Map<Long, Session> sessions = sessionRepository.findAllById(sessionIds).stream()
                .collect(Collectors.toMap(Session::getId, Function.identity()));

        List<SessionReportSummaryResponse> result = new ArrayList<>(reports.size());
        for (SessionReport report : reports) {
            Session session = sessions.get(report.getSessionId());
            String title = session != null ? session.getTitle() : ("세션 #" + report.getSessionId());
            result.add(SessionReportSummaryResponse.from(report, title));
        }
        return result;
    }

    private boolean canViewUserReport(AuthUser requester, Long targetUserId) {
        if (requester.id().equals(targetUserId)) {
            return true;
        }
        if (MASTER_ROLE.equals(requester.role())) {
            return true;
        }
        if (MANAGER_ROLE.equals(requester.role())) {
            return true;
        }
        return false;
    }
}
