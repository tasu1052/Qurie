package com.roma.qurie.classes;

import com.roma.qurie.classes.dto.ClassCreateRequest;
import com.roma.qurie.classes.dto.ClassResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ClassService {

    private static final String MASTER_ROLE = "MASTER";

    private final ClassRepository classRepository;
    private final TrackRepository trackRepository;
    private final ClassUserRepository classUserRepository;

    /* 클래스를 생성하는 함수 */
    @Transactional
    public ClassResponse create(AuthUser authUser, ClassCreateRequest request) {
        requireMaster(authUser);

        Track track =
                trackRepository
                        .findById(request.trackId())
                        .orElseThrow(
                                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "트랙을 찾을 수 없습니다."));

        // 다른 기업의 트랙 밑에 클래스를 만들지 못하게 막는다.
        if (!track.getEnterprise().getId().equals(authUser.enterpriseId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기업의 트랙에는 클래스를 만들 수 없습니다.");
        }

        if (classRepository.existsByTrackIdAndClassNumber(request.trackId(), request.classNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 트랙에 동일한 반 번호가 이미 있습니다.");
        }

        ClassEntity classEntity =
                ClassEntity.builder()
                        .track(track)
                        .classNumber(request.classNumber())
                        .name(request.name())
                        .capacity(request.capacity())
                        .description(request.description())
                        .startedAt(request.startedAt())
                        .endedAt(request.endedAt())
                        .build();

        return ClassResponse.from(classRepository.save(classEntity));
    }

    /**
     * 내가 속한 반 목록. 프론트는 이 결과의 classId 로 열린 방 목록을 조회한다 —
     * 로그인 응답과 JWT 에는 반 정보가 없어 이 경로가 유일한 출처다.
     * 마스터는 명단(class_users)에 담기지 않으므로 빈 목록이 나온다.
     */
    @Transactional(readOnly = true)
    public List<ClassResponse> getMyClasses(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return classUserRepository.findAllWithClassByUserId(authUser.id()).stream()
                .map(ClassUser::getClassEntity)
                .map(ClassResponse::from)
                .toList();
    }

    /**
     * todo: role 처리를 security에서 하면 지워야 함 (TrackService에도 같은 메서드가 있다)
     *
     * SecurityConfig가 아직 모든 요청을 permitAll로 두고 method security도 켜져 있지 않다.
     * @PreAuthorize를 붙이면 조용히 무시되므로 역할 검사를 여기서 직접 한다.
     */
    private void requireMaster(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!MASTER_ROLE.equals(authUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "클래스를 생성할 권한이 없습니다.");
        }
    }
}
