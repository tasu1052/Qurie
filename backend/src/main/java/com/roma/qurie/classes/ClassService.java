package com.roma.qurie.classes;

import com.roma.qurie.classes.dto.ClassCreateRequest;
import com.roma.qurie.classes.dto.ClassMemberResponse;
import com.roma.qurie.classes.dto.ClassResponse;
import com.roma.qurie.classes.dto.ClassUpdateRequest;
import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.group.GroupParticipant;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import com.roma.qurie.user.entity.UserRole;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
public class ClassService {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";
    private static final String STUDENT_ROLE = "STUDENT";
    private static final int MAX_PAGE_SIZE = 100;

    private final ClassRepository classRepository;
    private final TrackRepository trackRepository;
    private final ClassUserRepository classUserRepository;
    private final SessionRepository sessionRepository;
    private final GroupRepository groupRepository;
    private final GroupParticipantRepository groupParticipantRepository;

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

    /* 클래스 관리 목록을 조회하는 함수 */
    @Transactional(readOnly = true)
    public PageResponse<ClassResponse> getClasses(AuthUser authUser, Long trackId, String keyword,
            Pageable pageable) {
        requireMasterOrManager(authUser);

        return PageResponse.from(classRepository
                .findPage(authUser.enterpriseId(), trackId, blankToNull(keyword), toPageRequest(pageable))
                .map(ClassResponse::from));
    }

    /* 클래스 단건을 조회하는 함수. 학생은 자기 반만 볼 수 있다. */
    @Transactional(readOnly = true)
    public ClassResponse getClass(AuthUser authUser, Long classId) {
        requireLogin(authUser);
        ClassEntity classEntity = findClassInEnterprise(authUser, classId);

        if (STUDENT_ROLE.equals(authUser.role()) && !classId.equals(authUser.classId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "소속된 반이 아닙니다.");
        }
        return ClassResponse.from(classEntity);
    }

    /**
     * 반 명단을 조회하는 함수. 매니저 학생 관리 화면이 학생의 현재 그룹을 함께 보여주므로
     * 명단 페이지를 뽑은 뒤 반의 그룹 배정을 한 번에 읽어 합친다 — 명단 한 페이지는 최대 100명이라
     * 사람별로 그룹을 조회하면 N+1 이 된다.
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassMemberResponse> getMembers(AuthUser authUser, Long classId,
            UserRole role, String keyword, Pageable pageable) {
        requireMasterOrOwnClassManager(authUser, classId);
        findClassInEnterprise(authUser, classId);

        Page<ClassUser> memberPage = classUserRepository.findMemberPage(
                classId, role, blankToNull(keyword), toPageRequest(pageable));

        // 한 학생은 반에서 그룹 하나에만 속한다는 전제. 데이터가 어긋나 여러 행이 있어도 최신 배정 하나로 결정한다.
        Map<Long, GroupParticipant> assignmentByUserId = groupParticipantRepository
                .findAllWithGroupAndUserByClassId(classId).stream()
                .collect(Collectors.toMap(
                        participant -> participant.getUser().getId(),
                        participant -> participant,
                        (first, second) -> second.getId() > first.getId() ? second : first));

        return PageResponse.from(memberPage.map(classUser -> {
            GroupParticipant assignment = assignmentByUserId.get(classUser.getUser().getId());
            return ClassMemberResponse.of(classUser.getUser(), assignment != null ? assignment.getGroup() : null);
        }));
    }

    /* 클래스를 수정하는 함수. PATCH(부분 수정) 계약으로 보낸 항목만 반영한다. */
    @Transactional
    public ClassResponse update(AuthUser authUser, Long classId, ClassUpdateRequest request) {
        requireMasterOrOwnClassManager(authUser, classId);
        ClassEntity classEntity = findClassInEnterprise(authUser, classId);

        if (!request.hasAnyField()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 항목이 없습니다.");
        }

        if (request.hasClassNumber() && request.classNumber() != classEntity.getClassNumber()) {
            Long trackId = classEntity.getTrack().getId();
            if (classRepository.existsByTrackIdAndClassNumber(trackId, request.classNumber())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 트랙에 동일한 반 번호가 이미 있습니다.");
            }
            classEntity.changeClassNumber(request.classNumber());
        }
        if (request.hasName()) {
            classEntity.rename(request.name());
        }
        if (request.hasCapacity()) {
            classEntity.changeCapacity(request.capacity());
        }
        if (request.hasDescription()) {
            classEntity.changeDescription(request.description());
        }
        if (request.hasPeriod()) {
            LocalDateTime startedAt =
                    request.startedAt() != null ? request.startedAt() : classEntity.getStartedAt();
            LocalDateTime endedAt = request.endedAt() != null ? request.endedAt() : classEntity.getEndedAt();
            try {
                classEntity.changePeriod(startedAt, endedAt);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
            }
        }

        return ClassResponse.from(classEntity);
    }

    /**
     * 클래스를 삭제하는 함수. 세션 기록·그룹이 남아 있으면 학습 이력이 함께 사라지므로 삭제를 막고,
     * 명단(class_users)은 클래스에 종속된 데이터라 함께 지운다.
     *
     * todo: API 설계안의 ?cascade=true 강제 삭제와 deleted_at soft delete 는 팀 결정 후 별도 작업.
     */
    @Transactional
    public void delete(AuthUser authUser, Long classId) {
        requireMaster(authUser);
        ClassEntity classEntity = findClassInEnterprise(authUser, classId);

        if (sessionRepository.existsByClassId(classId) || groupRepository.existsByClassId(classId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "세션 또는 그룹이 있어 삭제할 수 없습니다. 먼저 정리해 주세요.");
        }

        classUserRepository.deleteByClassEntityId(classId);
        classRepository.delete(classEntity);
    }

    /* 다른 기업의 클래스는 존재 여부도 숨기기 위해 403이 아니라 404로 응답한다 (TrackService 와 같은 정책). */
    private ClassEntity findClassInEnterprise(AuthUser authUser, Long classId) {
        ClassEntity classEntity = classRepository
                .findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다."));
        if (!classEntity.getTrack().getEnterprise().getId().equals(authUser.enterpriseId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다.");
        }
        return classEntity;
    }

    private void requireLogin(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
    }

    /* 매니저는 자기가 담당하는 반(JWT 의 classId)만 수정·명단 조회할 수 있다. */
    private void requireMasterOrOwnClassManager(AuthUser authUser, Long classId) {
        requireLogin(authUser);
        if (MASTER_ROLE.equals(authUser.role())) {
            return;
        }
        if (MANAGER_ROLE.equals(authUser.role()) && classId.equals(authUser.classId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 클래스에 접근할 권한이 없습니다.");
    }

    private void requireMasterOrManager(AuthUser authUser) {
        requireLogin(authUser);
        if (!MASTER_ROLE.equals(authUser.role()) && !MANAGER_ROLE.equals(authUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "클래스 목록을 조회할 권한이 없습니다.");
        }
    }

    /* 목록 기본 정렬이 쿼리에 들어 있어 Pageable 의 Sort 는 버린다 (TrackService 와 같은 이유). */
    private PageRequest toPageRequest(Pageable pageable) {
        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), pageSize);
    }

    /* 빈 문자열이 그대로 들어오면 아무것도 맞지 않는 조건이 되므로 null 로 바꾼다. */
    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
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
