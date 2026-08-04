package com.roma.qurie.report.service;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.report.dto.UserReportCreateRequest;
import com.roma.qurie.report.dto.UserReportCreateResponse;
import com.roma.qurie.report.dto.UserReportDetailResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.entity.UserReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.function.ToIntFunction;

@Service
@RequiredArgsConstructor
public class UserReportService {

    private final UserReportRepository userReportRepository;
    private final SessionReportRepository sessionReportRepository;
    private final ClassUserRepository classUserRepository;
    private final UserRepository userRepository;

    /**
     * 사용자 최종 리포트 발급. 정량 지표는 그 반에서 발급된 세션 리포트들을 합산해 계산한다 —
     * 세션마다 문항 수가 달라 "세션별 비율의 평균"은 왜곡되므로, 개수를 모두 더한 뒤 나눈다.
     */
    @Transactional
    public UserReportCreateResponse createUserReport(Long ordinaryUserId, UserReportCreateRequest request) {
        if (!classUserRepository.existsByClassEntityIdAndUserId(request.classId(), ordinaryUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "반 명단에 없는 사용자입니다.");
        }
        if (userReportRepository.existsByOrdinaryUserIdAndClassId(ordinaryUserId, request.classId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 발급된 최종 리포트가 있습니다.");
        }

        List<SessionReport> sessionReports =
                sessionReportRepository.findAllByClassIdAndOrdinaryUserId(request.classId(), ordinaryUserId);

        int quizTotalCount = sumOf(sessionReports, SessionReport::getQuizTotalCount);
        int quizAttemptedCount = sumOf(sessionReports, SessionReport::getQuizAttemptedCount);
        int quizCorrectCount = sumOf(sessionReports, SessionReport::getQuizCorrectCount);

        UserReport userReport = UserReport.builder()
                .ordinaryUserId(ordinaryUserId)
                .classId(request.classId())
                .sessionCount(sessionReports.size())
                .quizTotalCount(quizTotalCount)
                .quizAttemptedCount(quizAttemptedCount)
                .quizCorrectCount(quizCorrectCount)
                .quizSkippedCount(sumOf(sessionReports, SessionReport::getQuizSkippedCount))
                .completionRate(ReportMath.percentOf(quizAttemptedCount, quizTotalCount))
                .accuracy(ReportMath.percentOf(quizCorrectCount, quizAttemptedCount))
                .avgElapsedMs(weightedAvgElapsedMs(sessionReports))
                .difficultyRatio(mergeCounts(sessionReports, SessionReport::getDifficultyRatio))
                .conceptStats(mergeCounts(sessionReports, SessionReport::getConceptStats))
                .rating(request.rating())
                .ratingFormulaVersion(request.ratingFormulaVersion())
                .issuedAt(LocalDateTime.now())
                .build();

        return UserReportCreateResponse.from(userReportRepository.save(userReport));
    }

    /** 사용자 최종 리포트 조회. 본인 또는 매니저/마스터만 볼 수 있다. */
    @Transactional(readOnly = true)
    public UserReportDetailResponse getUserReport(Long ordinaryUserId, Long classId, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!ReportAccessPolicy.canView(requester, ordinaryUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 최종 리포트를 조회할 권한이 없습니다.");
        }

        UserReport report = userReportRepository.findByOrdinaryUserIdAndClassId(ordinaryUserId, classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "발급된 최종 리포트가 없습니다."));
        String userName = userRepository.findById(ordinaryUserId).map(User::getName).orElse("알 수 없음");

        return UserReportDetailResponse.from(report, userName);
    }

    private int sumOf(List<SessionReport> reports, ToIntFunction<SessionReport> extractor) {
        return reports.stream().mapToInt(extractor).sum();
    }

    /** 세션별 평균의 단순 평균이 아니라 응시 수로 가중한다 — 많이 푼 세션이 그만큼 반영되어야 한다. */
    private Integer weightedAvgElapsedMs(List<SessionReport> reports) {
        long weightedSum = 0L;
        long attemptedSum = 0L;
        for (SessionReport report : reports) {
            if (report.getAvgElapsedMs() == null || report.getQuizAttemptedCount() == 0) {
                continue;
            }
            weightedSum += (long) report.getAvgElapsedMs() * report.getQuizAttemptedCount();
            attemptedSum += report.getQuizAttemptedCount();
        }
        if (attemptedSum == 0) {
            return null;
        }
        return (int) (weightedSum / attemptedSum);
    }

    /**
     * 세션 리포트의 개수 기반 JSON({total,attempted,correct})을 키별로 합산한다.
     * 키 순서는 정렬로 고정해 같은 데이터면 같은 JSON 이 나오게 한다.
     */
    private Map<String, Object> mergeCounts(
            List<SessionReport> reports, Function<SessionReport, Map<String, Object>> extractor) {
        Map<String, Object> merged = new TreeMap<>();
        for (SessionReport report : reports) {
            Map<String, Object> source = extractor.apply(report);
            if (source == null) {
                continue;
            }
            for (Map.Entry<String, Object> entry : source.entrySet()) {
                if (!(entry.getValue() instanceof Map<?, ?> counts)) {
                    continue;
                }
                accumulate(countsAt(merged, entry.getKey()), counts);
            }
        }
        return merged;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> countsAt(Map<String, Object> merged, String key) {
        return (Map<String, Object>) merged.computeIfAbsent(key, ignored -> {
            Map<String, Object> counts = new LinkedHashMap<>();
            counts.put("total", 0);
            counts.put("attempted", 0);
            counts.put("correct", 0);
            return counts;
        });
    }

    private void accumulate(Map<String, Object> target, Map<?, ?> source) {
        for (String key : List.of("total", "attempted", "correct")) {
            target.put(key, intOf(target.get(key)) + intOf(source.get(key)));
        }
    }

    /** JSON 컬럼의 숫자는 역직렬화 방식에 따라 Integer/Long 으로 올 수 있어 Number 로 받는다. */
    private int intOf(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }
}
