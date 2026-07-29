package com.roma.qurie.group.dto;

import com.roma.qurie.group.Group;
import com.roma.qurie.group.GroupParticipant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 그룹 상세. 편집 화면이 현재 구성원을 함께 필요로 하므로 members 를 붙여 내려준다.
 */
public record GroupDetailResponse(
        Long id,
        Long classId,
        String name,
        String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        int memberCount,
        List<GroupMemberResponse> members,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static GroupDetailResponse of(Group group, List<GroupParticipant> participants) {
        List<GroupMemberResponse> members = participants.stream()
                .map(GroupMemberResponse::from)
                .toList();
        return new GroupDetailResponse(
                group.getId(),
                group.getClassId(),
                group.getName(),
                group.getDescription(),
                group.getStartedAt(),
                group.getEndedAt(),
                members.size(),
                members,
                group.getCreatedAt(),
                group.getUpdatedAt());
    }
}
