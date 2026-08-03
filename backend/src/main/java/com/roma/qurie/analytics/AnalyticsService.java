package com.roma.qurie.analytics;

import com.roma.qurie.analytics.dto.AnalyticsOverviewResponse;
import com.roma.qurie.analytics.dto.ClassAnalyticsResponse;
import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.track.TrackRepository;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";

    private final TrackRepository trackRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassUserRepository classUserRepository;
    private final GroupRepository groupRepository;
    private final SessionRepository sessionRepository;
    private final UserReportRepository userReportRepository;

    /* 기업 KPI 4종을 집계하는 함수 */
    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse getOverview(AuthUser requester) {
        requireMaster(requester);

        Long enterpriseId = requester.enterpriseId();
        return new AnalyticsOverviewResponse(
                trackRepository.countByEnterpriseId(enterpriseId),
                classRepository.countActive(enterpriseId, LocalDateTime.now()),
                userRepository.countByEnterpriseIdAndRole(enterpriseId, UserRole.MANAGER),
                userRepository.countByEnterpriseIdAndRole(enterpriseId, UserRole.STUDENT));
    }

    /**
     * 클래스 상세 화면의 분석 요약. 인원·그룹·세션 수와 리포트 기반 학습 지표를 조회 시점에 집계한다.
     *
     * 마스터는 자기 기업의 반을, 강사는 자기가 속한 반만 볼 수 있다.
     */
    @Transactional(readOnly = true)
    public ClassAnalyticsResponse getClassAnalytics(Long classId, AuthUser requester) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다: " + classId));
        requireClassViewer(classEntity, requester);

        UserReportRepository.ClassReportSummary summary = userReportRepository.summarizeByClassId(classId);
        return new ClassAnalyticsResponse(
                classId,
                classUserRepository.countByClassEntityIdAndUserRole(classId, UserRole.STUDENT),
                classUserRepository.countByClassEntityIdAndUserRole(classId, UserRole.MANAGER),
                groupRepository.countByClassId(classId),
                sessionRepository.countByClassId(classId),
                sessionRepository.countByClassIdAndActive(classId, true),
                summary.getReportedStudentCount(),
                summary.getAvgAccuracy(),
                summary.getAvgCompletionRate(),
                summary.getAvgElapsedMs() == null ? null : (int)Math.round(summary.getAvgElapsedMs()));
    }

    private void requireClassViewer(ClassEntity classEntity, AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (MASTER_ROLE.equals(requester.role())) {
            if (!classEntity.getTrack().getEnterprise().getId().equals(requester.enterpriseId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 클래스는 조회할 수 없습니다.");
            }
            return;
        }
        if (!MANAGER_ROLE.equals(requester.role())
                || !classUserRepository.existsByClassEntityIdAndUserId(classEntity.getId(), requester.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 클래스의 지표를 조회할 권한이 없습니다.");
        }
    }

    /**
     * todo: role 처리를 security에서 하면 지워야 함
     */
    private void requireMaster(AuthUser requester) {
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!MASTER_ROLE.equals(requester.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "기업 지표를 조회할 권한이 없습니다.");
        }
    }
}
