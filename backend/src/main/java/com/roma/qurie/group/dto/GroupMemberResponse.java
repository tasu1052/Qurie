package com.roma.qurie.group.dto;

import com.roma.qurie.group.GroupParticipant;
import com.roma.qurie.group.GroupParticipantRole;

/**
 * 그룹 구성원 한 명. 화면이 "LEADER 박민수 / PARTICIPANT 6" 형태로 보여주므로 역할을 함께 내려준다.
 */
public record GroupMemberResponse(Long userId, String name, String email, GroupParticipantRole role) {

    public static GroupMemberResponse from(GroupParticipant participant) {
        return new GroupMemberResponse(
                participant.getUser().getId(),
                participant.getUser().getName(),
                participant.getUser().getEmail(),
                participant.getRole());
    }
}
