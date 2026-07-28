package com.roma.qurie.analytics;

import com.roma.qurie.analytics.dto.AnalyticsOverviewResponse;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.security.AuthUser;
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

    private final TrackRepository trackRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;

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
