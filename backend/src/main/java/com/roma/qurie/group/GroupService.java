package com.roma.qurie.group;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupResponse;
import com.roma.qurie.group.dto.GroupUpdateRequest;
import com.roma.qurie.security.AuthUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GroupService {

    private static final String MASTER_ROLE = "MASTER";
    private static final String MANAGER_ROLE = "MANAGER";

    private final GroupRepository groupRepository;
    private final ClassRepository classRepository;

    /* 그룹을 생성하는 함수 */
    @Transactional
    public GroupResponse create(GroupCreateRequest request) {
        Group group =
                Group.builder()
                        .classId(request.classId())
                        .name(request.name())
                        .description(request.description())
                        .startedAt(request.startedAt())
                        .endedAt(request.endedAt())
                        .build();
        return GroupResponse.from(groupRepository.save(group));
    }

    /* 반의 그룹 목록을 조회하는 함수. 반당 그룹은 소수라 페이징 없이 전체를 돌려준다. */
    @Transactional(readOnly = true)
    public List<GroupResponse> getGroups(AuthUser authUser, Long classId) {
        verifyClassAccessible(authUser, classId);
        return groupRepository.findAllByClassIdOrderByNameAsc(classId).stream()
                .map(GroupResponse::from)
                .toList();
    }

    /* 그룹 단건을 조회하는 함수 */
    @Transactional(readOnly = true)
    public GroupResponse getGroup(AuthUser authUser, Long groupId) {
        Group group = findGroup(groupId);
        verifyClassAccessible(authUser, group.getClassId());
        return GroupResponse.from(group);
    }

    /* 그룹을 수정하는 함수. PUT(전체 교체) 계약이다. */
    @Transactional
    public GroupResponse update(AuthUser authUser, Long groupId, GroupUpdateRequest request) {
        Group group = findGroup(groupId);
        requireMasterOrOwnClassManager(authUser, group.getClassId());

        try {
            group.update(request.name(), request.description(), request.startedAt(), request.endedAt());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
        return GroupResponse.from(group);
    }

    /**
     * 그룹을 삭제하는 함수.
     *
     * todo: group_participants 엔티티가 생기면 삭제 전 구성원 정리(또는 함께 삭제)를 추가해야 한다.
     */
    @Transactional
    public void delete(AuthUser authUser, Long groupId) {
        Group group = findGroup(groupId);
        requireMasterOrOwnClassManager(authUser, group.getClassId());
        groupRepository.delete(group);
    }

    private Group findGroup(Long groupId) {
        return groupRepository
                .findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "그룹을 찾을 수 없습니다."));
    }

    /*
     * 조회 권한. 마스터는 자기 기업의 반이면 되고, 매니저·학생은 자기 반(JWT 의 classId)만 볼 수 있다.
     * 다른 기업의 반은 존재 여부도 숨기기 위해 404 로 응답한다 (Track·Class 와 같은 정책).
     */
    private void verifyClassAccessible(AuthUser authUser, Long classId) {
        requireLogin(authUser);
        if (MASTER_ROLE.equals(authUser.role())) {
            ClassEntity classEntity = classRepository
                    .findById(classId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다."));
            if (!classEntity.getTrack().getEnterprise().getId().equals(authUser.enterpriseId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "클래스를 찾을 수 없습니다.");
            }
            return;
        }
        if (!classId.equals(authUser.classId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "소속된 반이 아닙니다.");
        }
    }

    /**
     * todo: role 처리를 security에서 하면 지워야 함 (Track·Class 서비스에도 같은 가드가 있다)
     */
    private void requireMasterOrOwnClassManager(AuthUser authUser, Long classId) {
        requireLogin(authUser);
        if (MASTER_ROLE.equals(authUser.role())) {
            return;
        }
        if (MANAGER_ROLE.equals(authUser.role()) && classId.equals(authUser.classId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "그룹을 수정할 권한이 없습니다.");
    }

    private void requireLogin(AuthUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
    }
}
