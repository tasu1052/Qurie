package com.roma.qurie.group;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUser;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupDetailResponse;
import com.roma.qurie.group.dto.GroupDuplicateRequest;
import com.roma.qurie.group.dto.GroupEditRequest;
import com.roma.qurie.group.dto.GroupMemberCandidateResponse;
import com.roma.qurie.group.dto.GroupResponse;
import com.roma.qurie.group.dto.GroupShuffleRequest;
import com.roma.qurie.group.dto.GroupUpdateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    private static final String DUPLICATE_NAME_SUFFIX = " (복사)";

    private final GroupRepository groupRepository;
    private final ClassRepository classRepository;
    private final ClassUserRepository classUserRepository;
    private final GroupParticipantRepository groupParticipantRepository;

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

    /** 그룹을 삭제하는 함수. 구성원 배정은 그룹에 종속된 데이터라 함께 지운다. */
    @Transactional
    public void delete(AuthUser authUser, Long groupId) {
        Group group = findGroup(groupId);
        requireMasterOrOwnClassManager(authUser, group.getClassId());

        groupParticipantRepository.deleteByGroupId(groupId);
        groupParticipantRepository.flush();
        groupRepository.delete(group);
    }

    /* 그룹 상세를 조회하는 함수. 편집 화면이 현재 구성원을 함께 필요로 한다. */
    @Transactional(readOnly = true)
    public GroupDetailResponse getGroupDetail(AuthUser authUser, Long groupId) {
        Group group = findGroup(groupId);
        verifyClassAccessible(authUser, group.getClassId());
        return GroupDetailResponse.of(group, groupParticipantRepository.findAllWithUserByGroupId(groupId));
    }

    /**
     * 배정 후보 목록을 조회하는 함수. 반 인원 전체를 돌려주며 이미 다른 그룹에 속한 사람은
     * 현재 그룹을 함께 표시한다("정유진 — 현재 그룹 B").
     */
    @Transactional(readOnly = true)
    public List<GroupMemberCandidateResponse> getMemberCandidates(AuthUser authUser, Long classId) {
        verifyClassAccessible(authUser, classId);

        Map<Long, Group> groupByUserId = new LinkedHashMap<>();
        for (GroupParticipant participant : groupParticipantRepository.findAllWithGroupAndUserByClassId(classId)) {
            groupByUserId.put(participant.getUser().getId(), participant.getGroup());
        }

        return classUserRepository.findAllWithUserByClassEntityId(classId).stream()
                .map(ClassUser::getUser)
                .map(user -> {
                    Group current = groupByUserId.get(user.getId());
                    return new GroupMemberCandidateResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            current == null ? null : current.getId(),
                            current == null ? null : current.getName());
                })
                .toList();
    }

    /**
     * 그룹을 편집하는 함수. 제목·설명·운영 기간·구성원을 한 번에 저장하며 보낸 항목만 반영한다.
     * memberIds 는 최종 명단이라 빠진 사람은 그룹에서 제외된다.
     */
    @Transactional
    public GroupDetailResponse edit(AuthUser authUser, Long groupId, GroupEditRequest request) {
        Group group = findGroup(groupId);
        requireMasterOrOwnClassManager(authUser, group.getClassId());

        if (!request.hasAnyField()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 항목이 없습니다.");
        }

        if (request.hasName()) {
            group.rename(requireNotBlank(request.name(), "그룹 이름"));
        }
        if (request.hasDescription()) {
            group.changeDescription(requireNotBlank(request.description(), "그룹 설명"));
        }
        if (request.hasPeriod()) {
            LocalDateTime startedAt = request.startedAt() != null ? request.startedAt() : group.getStartedAt();
            LocalDateTime endedAt = request.endedAt() != null ? request.endedAt() : group.getEndedAt();
            applyPeriod(group, startedAt, endedAt);
        }
        if (request.hasMembers()) {
            replaceMembers(group, request.memberIds(), request.leaderId());
        } else if (request.leaderId() != null) {
            changeLeader(groupId, request.leaderId());
        }

        return GroupDetailResponse.of(group, groupParticipantRepository.findAllWithUserByGroupId(groupId));
    }

    /**
     * 그룹을 복제하는 함수. 이름·설명·운영 기간(레이아웃)을 그대로 가진 새 그룹을 만든다.
     * 구성원 복제는 기본으로 끈다 — 한 사람이 두 그룹에 동시에 들어가는 상태가 만들어지기 때문이다.
     */
    @Transactional
    public GroupDetailResponse duplicate(AuthUser authUser, Long groupId, GroupDuplicateRequest request) {
        Group source = findGroup(groupId);
        requireMasterOrOwnClassManager(authUser, source.getClassId());

        String name = request.name() != null && !request.name().isBlank()
                ? request.name().trim()
                : source.getName() + DUPLICATE_NAME_SUFFIX;

        Group copy = Group.builder()
                .classId(source.getClassId())
                .name(name)
                .description(source.getDescription())
                .startedAt(source.getStartedAt())
                .endedAt(source.getEndedAt())
                .build();
        Group saved = groupRepository.save(copy);

        if (request.shouldIncludeMembers()) {
            List<GroupParticipant> copies = groupParticipantRepository.findAllWithUserByGroupId(groupId).stream()
                    .map(participant ->
                            new GroupParticipant(saved, participant.getUser(), participant.getRole()))
                    .toList();
            groupParticipantRepository.saveAll(copies);
        }

        return GroupDetailResponse.of(saved, groupParticipantRepository.findAllWithUserByGroupId(saved.getId()));
    }

    /**
     * 반 인원을 대상 그룹들에 무작위로 나눠 담는 함수. 대상 그룹의 기존 구성원은 모두 지우고 새로 채운다.
     *
     * 인원이 그룹 수로 나누어떨어지지 않으면 앞쪽 그룹이 한 명 더 받는다.
     */
    @Transactional
    public List<GroupDetailResponse> shuffle(AuthUser authUser, Long classId, GroupShuffleRequest request) {
        requireMasterOrOwnClassManager(authUser, classId);

        List<Group> targets = groupRepository.findAllById(request.groupIds());
        if (targets.size() != new HashSet<>(request.groupIds()).size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 그룹이 포함되어 있습니다.");
        }
        boolean allInClass = targets.stream().allMatch(group -> classId.equals(group.getClassId()));
        if (!allInClass) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "다른 반의 그룹은 함께 배정할 수 없습니다.");
        }

        List<User> members = new ArrayList<>(classUserRepository.findAllWithUserByClassEntityId(classId).stream()
                .map(ClassUser::getUser)
                .toList());
        if (members.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "반에 배정할 인원이 없습니다.");
        }
        Collections.shuffle(members);

        request.groupIds().forEach(groupParticipantRepository::deleteByGroupId);
        // 아래 saveAll 이 같은 (group_id, user_id) 로 들어갈 수 있어 삭제를 먼저 DB 에 반영한다.
        groupParticipantRepository.flush();

        List<GroupParticipant> assignments = new ArrayList<>();
        for (int index = 0; index < members.size(); index++) {
            Group target = targets.get(index % targets.size());
            boolean firstOfGroup = index < targets.size();
            GroupParticipantRole role = request.shouldAssignLeader() && firstOfGroup
                    ? GroupParticipantRole.LEADER
                    : GroupParticipantRole.PARTICIPANT;
            assignments.add(new GroupParticipant(target, members.get(index), role));
        }
        groupParticipantRepository.saveAll(assignments);

        Map<Long, List<GroupParticipant>> byGroupId = assignments.stream()
                .collect(Collectors.groupingBy(participant -> participant.getGroup().getId()));
        return targets.stream()
                .map(group -> GroupDetailResponse.of(group, byGroupId.getOrDefault(group.getId(), List.of())))
                .toList();
    }

    /* 최종 명단으로 구성원을 교체한다. 반 명단에 없는 사람은 그룹에 넣을 수 없다. */
    private void replaceMembers(Group group, List<Long> memberIds, Long leaderId) {
        Set<Long> distinctIds = new HashSet<>(memberIds);
        if (leaderId != null && !distinctIds.contains(leaderId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "리더는 구성원 중에서 지정해야 합니다.");
        }

        Map<Long, User> classMembers = classUserRepository
                .findAllWithUserByClassEntityId(group.getClassId()).stream()
                .map(ClassUser::getUser)
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left));

        List<GroupParticipant> participants = new ArrayList<>();
        for (Long memberId : distinctIds) {
            User user = classMembers.get(memberId);
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "반 명단에 없는 사용자는 배정할 수 없습니다.");
            }
            GroupParticipantRole role = memberId.equals(leaderId)
                    ? GroupParticipantRole.LEADER
                    : GroupParticipantRole.PARTICIPANT;
            participants.add(new GroupParticipant(group, user, role));
        }

        groupParticipantRepository.deleteByGroupId(group.getId());
        // 같은 사람이 지워졌다가 다시 들어갈 수 있어 유니크 제약 충돌을 피하려면 삭제를 먼저 반영해야 한다.
        groupParticipantRepository.flush();
        groupParticipantRepository.saveAll(participants);
    }

    /* 구성원은 그대로 두고 리더만 옮긴다. */
    private void changeLeader(Long groupId, Long leaderId) {
        List<GroupParticipant> participants = groupParticipantRepository.findAllWithUserByGroupId(groupId);
        boolean isMember = participants.stream()
                .anyMatch(participant -> participant.getUser().getId().equals(leaderId));
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "리더는 구성원 중에서 지정해야 합니다.");
        }
        participants.forEach(participant -> participant.changeRole(
                participant.getUser().getId().equals(leaderId)
                        ? GroupParticipantRole.LEADER
                        : GroupParticipantRole.PARTICIPANT));
    }

    private void applyPeriod(Group group, LocalDateTime startedAt, LocalDateTime endedAt) {
        try {
            group.changePeriod(startedAt, endedAt);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    private String requireNotBlank(String value, String fieldName) {
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "은 공백일 수 없습니다.");
        }
        return trimmed;
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
