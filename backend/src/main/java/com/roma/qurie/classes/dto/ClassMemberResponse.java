package com.roma.qurie.classes.dto;

import com.roma.qurie.group.Group;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;

/**
 * 반 명단 조회 응답. 매니저 학생 관리 화면이 학생의 현재 그룹을 함께 보여주므로 그룹을 포함한다.
 * 그룹 미배정이면 groupId·groupName 은 null. phone 은 마이페이지 선택 입력이라 null 일 수 있다.
 *
 * todo: 화면의 완료율·액티비티는 퀴즈 분석 집계가 필요해 분석 API 쪽에서 별도로 다룬다.
 */
public record ClassMemberResponse(
        Long userId,
        String name,
        String email,
        UserRole role,
        Long groupId,
        String groupName,
        String phone) {

    public static ClassMemberResponse of(User user, Group group) {
        return new ClassMemberResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                group != null ? group.getId() : null,
                group != null ? group.getName() : null,
                user.getPhone());
    }
}
