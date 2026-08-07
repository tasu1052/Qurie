package com.roma.qurie.report.service;

import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;
import com.roma.qurie.report.ai.AiReportSummary;
import com.roma.qurie.notification.service.AppNotificationService;
import com.roma.qurie.report.dto.SessionReportBulkResponse;
import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportCreateResponse;
import com.roma.qurie.report.dto.SessionReportDetailResponse;
import com.roma.qurie.report.dto.SessionReportManagerCommentRequest;
import com.roma.qurie.report.dto.SessionReportRosterItemResponse;
import com.roma.qurie.report.dto.SessionReportRosterResponse;
import com.roma.qurie.report.dto.SessionReportSummaryResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantResolver;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionReportService {

    private static final String MANAGER_ROLE = "MANAGER";
    private static final String MASTER_ROLE = "MASTER";

    private final SessionReportRepository sessionReportRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SessionParticipantService sessionParticipantService;
    private final SessionParticipantResolver participantResolver;
    private final ProjectRepository projectRepository;
    private final QuizSetRepository quizSetRepository;
    private final QuizProgressRepository quizProgressRepository;
    private final ReportAiFeedbackService reportAiFeedbackService;
    private final AppNotificationService appNotificationService;
    private final TransactionTemplate transactionTemplate;

    /**
     * 세션 리포트 발급. 정량 지표는 quiz_progress 에서 서버가 집계한다 —
     * 클라이언트가 보낸 숫자를 저장하면 조회 화면과 어긋나거나 조작될 수 있다.
     * 정성 항목(AI 코멘트)은 요청에 없으면 서버가 AI 서버를 호출해 채운다.
     * 발급 대상은 편성(그룹/반 명단) 기준 참여 학생으로 제한하고, 발급 자체는 같은 반 강사에게만 허용한다.
     */
    public SessionReportCreateResponse createSessionReport(
            Long sessionId, SessionReportCreateRequest request, AuthUser requester) {
        requireInstructor(sessionId, requester);
        Session session = findSessionOrThrow(sessionId);
        if (!participantResolver.isParticipantStudent(session, request.ordinaryUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "세션 참여 대상 학생이 아닙니다.");
        }
        return issueReport(sessionId, request);
    }

    /**
     * 세션 참여 학생 전원의 리포트 일괄 발급. 정량 지표는 서버 집계, AI 정성 항목은 학생별로 AI 서버를
     * 호출해 채운다(실패한 학생만 AI 항목 없이 발급). 평점은 일괄 발급에선 담지 않는다.
     * 이미 발급된 학생도 새 스냅샷으로 대체되므로 여러 번 눌러도 결과는 최신 집계 하나만 남는다.
     */
    public SessionReportBulkResponse createSessionReportsForAll(Long sessionId, AuthUser requester) {
        requireInstructor(sessionId, requester);
        Session session = findSessionOrThrow(sessionId);

        int issuedCount = 0;
        int failedCount = 0;
        for (Long studentId : participantResolver.resolveStudentIds(session)) {
            try {
                issueReport(sessionId, new SessionReportCreateRequest(studentId, null, null, null, null));
                issuedCount++;
            } catch (RuntimeException e) {
                // 한 학생 실패가 일괄 재발급 전체를 500 으로 끝내지 않도록 한다.
                failedCount++;
                log.warn("세션 {} 학생 {} 리포트 발급 실패: {}", sessionId, studentId, e.toString());
            }
        }
        if (issuedCount == 0 && failedCount > 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "리포트 발급에 실패했습니다.");
        }
        return new SessionReportBulkResponse(sessionId, issuedCount);
    }

    /** 리포트 발급은 학생 지표를 확정하는 조작이라 조회보다 좁게, 매니저·마스터에게만 허용한다. */
    private void requireInstructor(Long sessionId, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        sessionParticipantService.verifySessionClassMember(sessionId, requester);
        if (!MANAGER_ROLE.equals(requester.role()) && !MASTER_ROLE.equals(requester.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "세션 리포트는 강사만 발급할 수 있습니다.");
        }
    }

    /**
     * 재발급은 기존 리포트를 새 스냅샷으로 대체한다. (session_id, ordinary_user_id) 유니크 제약이 있고
     * Hibernate 가 insert 를 delete 보다 먼저 내보내므로, 삭제가 저장보다 먼저 DB 에 반영되도록 flush 한다.
     *
     * AI 호출(수 초)이 DB 커넥션을 점유하지 않도록 집계(읽기)와 저장(쓰기)만 각각 트랜잭션으로
     * 묶는다 — QuizService.requestQuizGeneration 과 같은 이유다.
     */
    private SessionReportCreateResponse issueReport(Long sessionId, SessionReportCreateRequest request) {
        QuizResultAggregate aggregate =
                transactionTemplate.execute(status -> aggregateQuizResults(sessionId, request.ordinaryUserId()));
        SessionReportCreateRequest enriched = enrichWithAiFeedback(sessionId, request, aggregate);

        return transactionTemplate.execute(status -> {
            sessionReportRepository.deleteBySessionIdAndOrdinaryUserId(sessionId, request.ordinaryUserId());
            sessionReportRepository.flush();

            SessionReport sessionReport = SessionReport.builder()
                    .sessionId(sessionId)
                    .ordinaryUserId(request.ordinaryUserId())
                    .quizSetId(aggregate.quizSetId())
                    .quizTotalCount(aggregate.totalCount())
                    .quizAttemptedCount(aggregate.attemptedCount())
                    .quizCorrectCount(aggregate.correctCount())
                    .quizSkippedCount(aggregate.skippedCount())
                    .completionRate(aggregate.completionRate())
                    .accuracy(aggregate.accuracy())
                    .avgElapsedMs(aggregate.avgElapsedMs())
                    .difficultyRatio(aggregate.difficultyRatio())
                    .conceptStats(aggregate.conceptStats())
                    .quizRating(enriched.quizRating())
                    .aiComment(enriched.aiComment())
                    .aiStrengths(enriched.aiStrengths())
                    .aiImprovements(enriched.aiImprovements())
                    .issuedAt(LocalDateTime.now())
                    .build();

            return SessionReportCreateResponse.from(sessionReportRepository.save(sessionReport));
        });
    }

    /**
     * 요청에 AI 코멘트가 없으면 서버가 AI 서버를 호출해 채운다. 단건 발급이 직접 실어 보낸 정성
     * 항목은 강사 입력일 수 있어 덮어쓰지 않는다. 생성 실패·스킵은 AI 항목 없는 발급으로 이어질
     * 뿐 발급 자체를 막지 않는다.
     */
    private SessionReportCreateRequest enrichWithAiFeedback(
            Long sessionId, SessionReportCreateRequest request, QuizResultAggregate aggregate) {
        boolean hasClientFeedback = request.aiComment() != null && !request.aiComment().isBlank();
        if (hasClientFeedback || aggregate.quizSetIds().isEmpty()) {
            return request;
        }
        String studentName = userRepository.findById(request.ordinaryUserId())
                .map(User::getName)
                .orElse("학생");
        ReportAiFeedbackService.AiFeedback feedback = reportAiFeedbackService.generate(
                studentName, sessionId, request.ordinaryUserId(), aggregate.quizSetIds(),
                new AiReportSummary(
                        aggregate.totalCount(), aggregate.attemptedCount(), aggregate.correctCount(),
                        aggregate.skippedCount(), aggregate.accuracy(), aggregate.completionRate(),
                        aggregate.avgElapsedMs(), aggregate.difficultyRatio(), aggregate.conceptStats()));
        if (feedback == null) {
            return request;
        }
        return new SessionReportCreateRequest(request.ordinaryUserId(), request.quizRating(),
                feedback.comment(), feedback.strengths(), feedback.improvements());
    }

    private Session findSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방을 찾을 수 없습니다."));
    }

    /**
     * 집계 기준은 세션 현재 프로젝트의 완료된 퀴즈셋 전부다.
     * 파일별로 여러 셋이 있을 수 있고, 같은 파일 재생성으로 지워진 옛 셋은 포함되지 않는다.
     */
    private QuizResultAggregate aggregateQuizResults(Long sessionId, Long userId) {
        List<QuizSet> completedSets = projectRepository.findFirstBySessionIdOrderByIdDesc(sessionId)
                .map(project -> quizSetRepository.findByProjectIdOrderByIdDesc(project.getId()).stream()
                        .filter(set -> set.getStatus() == QuizSetStatus.COMPLETED)
                        .toList())
                .orElse(List.of());
        if (completedSets.isEmpty()) {
            // 퀴즈 없이 끝난 세션도 리포트는 발급한다. 지표는 0 건으로 남는다.
            return QuizResultAggregate.empty();
        }

        List<Long> quizSetIds = completedSets.stream().map(QuizSet::getId).toList();
        List<Quiz> quizzes = new ArrayList<>();
        List<QuizProgress> progresses = new ArrayList<>();
        for (QuizSet quizSet : completedSets) {
            List<Quiz> effective = quizSet.effectiveQuizzes();
            Set<Long> effectiveIds = effective.stream()
                    .map(Quiz::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            quizzes.addAll(effective);
            progresses.addAll(dedupeByQuizId(
                    quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(quizSet.getId(), userId)
                            .stream()
                            .filter(progress -> progress.getQuiz() != null
                                    && effectiveIds.contains(progress.getQuiz().getId()))
                            .toList()));
        }

        int totalCount = quizzes.size();
        int attemptedCount = (int) progresses.stream().filter(SessionReportService::isAttempted).count();
        int correctCount = (int) progresses.stream().filter(SessionReportService::isCorrect).count();
        int skippedCount = progresses.size() - attemptedCount;

        return new QuizResultAggregate(
                quizSetIds.get(0),
                quizSetIds,
                totalCount,
                attemptedCount,
                correctCount,
                skippedCount,
                ReportMath.percentOf(attemptedCount, totalCount),
                ReportMath.percentOf(correctCount, attemptedCount),
                averageElapsedMs(progresses),
                difficultyRatioOf(quizzes, progresses),
                conceptStatsOf(quizzes, progresses));
    }

    private Map<String, Object> difficultyRatioOf(List<Quiz> quizzes, List<QuizProgress> progresses) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (QuizDifficulty difficulty : QuizDifficulty.values()) {
            long totalCount = quizzes.stream().filter(quiz -> quiz.getDifficulty() == difficulty).count();
            if (totalCount == 0) {
                continue;
            }
            List<QuizProgress> difficultyProgresses = progresses.stream()
                    .filter(progress -> progress.getQuiz().getDifficulty() == difficulty)
                    .toList();
            result.put(difficulty.name(), countsOf((int) totalCount, difficultyProgresses));
        }
        return result;
    }

    private Map<String, Object> conceptStatsOf(List<Quiz> quizzes, List<QuizProgress> progresses) {
        // 키 순서를 정렬로 고정해 같은 데이터면 같은 JSON 이 나오게 한다.
        Map<String, Object> result = new TreeMap<>();
        Map<String, List<Quiz>> byConcept =
                quizzes.stream().collect(Collectors.groupingBy(SessionReportService::conceptOf));
        for (Map.Entry<String, List<Quiz>> entry : byConcept.entrySet()) {
            List<QuizProgress> conceptProgresses = progresses.stream()
                    .filter(progress -> entry.getKey().equals(conceptOf(progress.getQuiz())))
                    .toList();
            result.put(entry.getKey(), countsOf(entry.getValue().size(), conceptProgresses));
        }
        return result;
    }

    /** 유저 리포트가 세션 리포트를 합산할 수 있도록 비율이 아니라 개수로 저장한다. */
    private Map<String, Object> countsOf(int totalCount, List<QuizProgress> progresses) {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("total", totalCount);
        counts.put("attempted", (int) progresses.stream().filter(SessionReportService::isAttempted).count());
        counts.put("correct", (int) progresses.stream().filter(SessionReportService::isCorrect).count());
        return counts;
    }

    private static boolean isAttempted(QuizProgress progress) {
        return progress.getStatus() == QuizProgressStatus.ATTEMPTED;
    }

    private static boolean isCorrect(QuizProgress progress) {
        return Boolean.TRUE.equals(progress.getIsCorrect());
    }

    /** choices fetch 조인으로 같은 응시 행이 여러 번 올 수 있어 quizId 기준으로 한 건만 남긴다. */
    private static List<QuizProgress> dedupeByQuizId(List<QuizProgress> progresses) {
        Set<Long> seenQuizIds = new LinkedHashSet<>();
        List<QuizProgress> unique = new ArrayList<>(progresses.size());
        for (QuizProgress progress : progresses) {
            Long quizId = progress.getQuiz() != null ? progress.getQuiz().getId() : null;
            // id 가 없으면(테스트 mock 등) 중복 판정 불가 — 행을 유지한다.
            if (quizId == null || seenQuizIds.add(quizId)) {
                unique.add(progress);
            }
        }
        return unique;
    }

    private static String conceptOf(Quiz quiz) {
        String concept = quiz.getTestedConcept();
        return concept == null || concept.isBlank() ? "기타" : concept;
    }

    /** 풀이 시간은 실제로 응시한 문항 기준이다. 스킵·타임아웃까지 섞으면 평균이 왜곡된다. */
    private static Integer averageElapsedMs(List<QuizProgress> progresses) {
        List<QuizProgress> attempted = progresses.stream().filter(SessionReportService::isAttempted).toList();
        if (attempted.isEmpty()) {
            return null;
        }
        long sum = 0L;
        for (QuizProgress progress : attempted) {
            sum += progress.getElapsedMs();
        }
        return (int) (sum / attempted.size());
    }

    private record QuizResultAggregate(
            Long quizSetId,
            List<Long> quizSetIds,
            int totalCount,
            int attemptedCount,
            int correctCount,
            int skippedCount,
            BigDecimal completionRate,
            BigDecimal accuracy,
            Integer avgElapsedMs,
            Map<String, Object> difficultyRatio,
            Map<String, Object> conceptStats) {

        static QuizResultAggregate empty() {
            return new QuizResultAggregate(null, List.of(), 0, 0, 0, 0, null, null, null, Map.of(), Map.of());
        }
    }

    /** 강사가 학생 세션 리포트에 코멘트를 남긴다. 학생에게 인앱 알림을 보낸다. */
    @Transactional
    public SessionReportDetailResponse updateManagerComment(
            Long sessionId, Long ordinaryUserId, SessionReportManagerCommentRequest request, AuthUser requester) {
        requireInstructor(sessionId, requester);
        SessionReport report = sessionReportRepository
                .findBySessionIdAndOrdinaryUserId(sessionId, ordinaryUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "세션 리포트를 찾을 수 없습니다."));
        report.updateManagerComment(request.comment().trim(), requester.id());

        Session session = findSessionOrThrow(sessionId);
        String title = "세션 리포트에 강사 코멘트가 달렸어요";
        String body = session.getTitle() != null ? session.getTitle() : ("세션 #" + sessionId);
        appNotificationService.notifyUsers(
                List.of(ordinaryUserId),
                AppNotificationService.TYPE_REPORT_COMMENT,
                title,
                body,
                "/session/" + sessionId + "/report");

        String userName = userRepository.findById(ordinaryUserId).map(User::getName).orElse("알 수 없음");
        return SessionReportDetailResponse.from(report, session.getTitle(), userName);
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
        if (!ReportAccessPolicy.canView(requester, targetUserId)) {
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

    /**
     * 세션에 발급된 학생 리포트 전체 명단. 같은 반 강사(매니저·마스터)만 조회한다 —
     * 세션 종료 후 전원 결과를 한눈에 볼 때 쓴다.
     */
    @Transactional(readOnly = true)
    public SessionReportRosterResponse listSessionReportRoster(Long sessionId, AuthUser requester) {
        requireInstructor(sessionId, requester);
        Session session = findSessionOrThrow(sessionId);

        List<SessionReport> reports = sessionReportRepository.findBySessionIdOrderByIssuedAtDesc(sessionId);
        if (reports.isEmpty()) {
            return new SessionReportRosterResponse(sessionId, session.getTitle(), 0, null, null, List.of());
        }

        List<Long> userIds = reports.stream().map(SessionReport::getOrdinaryUserId).distinct().toList();
        Map<Long, String> names = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));

        List<SessionReportRosterItemResponse> items = new ArrayList<>(reports.size());
        for (SessionReport report : reports) {
            String userName = names.getOrDefault(report.getOrdinaryUserId(), "알 수 없음");
            items.add(SessionReportRosterItemResponse.from(report, userName));
        }
        return new SessionReportRosterResponse(
                sessionId,
                session.getTitle(),
                items.size(),
                averageOf(reports, SessionReport::getAccuracy),
                averageOf(reports, SessionReport::getCompletionRate),
                items);
    }

    private static Double averageOf(List<SessionReport> reports, Function<SessionReport, BigDecimal> getter) {
        List<BigDecimal> values = reports.stream().map(getter).filter(Objects::nonNull).toList();
        if (values.isEmpty()) {
            return null;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP).doubleValue();
    }

    /**
     * 사용자의 세션 리포트 목록. 본인 또는 같은 반 매니저/마스터만 조회.
     * 삭제된 세션의 고아 리포트는 제외한다 — 포함하면 이름 없는 세션 행이 노출되고,
     * 화면의 참여 횟수가 최종 리포트 집계와 어긋난다.
     */
    @Transactional(readOnly = true)
    public List<SessionReportSummaryResponse> listSessionReports(Long ordinaryUserId, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!ReportAccessPolicy.canView(requester, ordinaryUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "세션 리포트 목록을 조회할 권한이 없습니다.");
        }

        List<SessionReport> reports =
                sessionReportRepository.findAllWithSessionByOrdinaryUserId(ordinaryUserId);
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
}
