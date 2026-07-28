package com.roma.qurie.track;

import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.enterprise.EnterpriseRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.dto.TrackCreateRequest;
import com.roma.qurie.track.dto.TrackResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TrackService {

    private static final String MASTER_ROLE = "MASTER";

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
