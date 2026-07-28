package com.roma.qurie.track;

import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.enterprise.EnterpriseRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.dto.TrackCreateRequest;
import com.roma.qurie.track.dto.TrackResponse;
import com.roma.qurie.track.dto.TrackSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TrackService {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";
    private static final int MAX_PAGE_SIZE = 100;

    private final TrackRepository trackRepository;
    private final EnterpriseRepository enterpriseRepository;

    /* 트랙을 생성하는 함수 */
    @Transactional
    public TrackResponse create(AuthUser authUser, TrackCreateRequest request) {
        requireMaster(authUser);

        if (trackRepository.existsByEnterpriseIdAndName(authUser.enterpriseId(), request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 이름의 트랙이 이미 있습니다.");
        }

        Enterprise enterprise =
                enterpriseRepository
                        .findById(authUser.enterpriseId())
                        .orElseThrow(
                                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "소속 기업을 찾을 수 없습니다."));

        Track track = new Track(enterprise, request.name(), request.description(), request.tech());
        return TrackResponse.from(trackRepository.save(track));
    }

    /* 트랙 목록을 조회하는 함수. 마스터 대시보드의 트랙 현황도 같은 조회를 size로 잘라 쓴다. */
    @Transactional(readOnly = true)
    public PageResponse<TrackSummaryResponse> getTrackSummaries(
            AuthUser authUser, String keyword, String tech, Pageable pageable) {
        requireMasterOrManager(authUser);

        Page<TrackSummaryResponse> summaries =
                trackRepository.findSummaries(
                        authUser.enterpriseId(), blankToNull(tech), blankToNull(keyword), toPageRequest(pageable));

        return PageResponse.from(summaries);
    }

    /*
     * Sort는 일부러 버린다. findSummaries 쿼리에 order by가 이미 들어 있어서 Pageable의 Sort를 그대로 넘기면
     * Spring Data가 order by를 덧붙이는데, classCount는 실제 매핑된 속성이 아니라 그 시점에 쿼리가 깨진다.
     */
    private PageRequest toPageRequest(Pageable pageable) {
        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), pageSize);
    }

    /* 빈 문자열이 그대로 들어오면 t.tech = '' 처럼 아무것도 맞지 않는 조건이 되므로 null로 바꾼다. */
    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    /**
     * todo: role 처리를 security에서 하면 지워야 함
     */
    private void requireMasterOrManager(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!MASTER_ROLE.equals(authUser.role()) && !MANAGER_ROLE.equals(authUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "트랙을 조회할 권한이 없습니다.");
        }
    }

    /**
     * todo: role 처리를 security에서 하면 지워야 함
     *
     * SecurityConfig가 아직 모든 요청을 permitAll로 두고 method security도 켜져 있지 않다.
     * @PreAuthorize를 붙이면 조용히 무시되므로 역할 검사를 여기서 직접 한다.
     */
    private void requireMaster(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!MASTER_ROLE.equals(authUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "트랙을 생성할 권한이 없습니다.");
        }
    }
}
