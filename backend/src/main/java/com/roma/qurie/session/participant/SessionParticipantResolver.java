package com.roma.qurie.session.participant;

import java.util.List;

import org.springframework.stereotype.Component;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

/**
 * 세션의 "참여 대상"을 편성 기준으로 해석한다. 출석을 따로 기록하지 않으므로,
 * 그룹 세션은 그룹 편성(group_participants), 반 공개 세션은 반 명단(class_users)이 기준이다.
 * 리포트 발급 대상 결정과 참여 세션 목록 필터가 서로 다른 정의를 쓰지 않도록 한 곳에 모은다.
 */
@Component
@RequiredArgsConstructor
public class SessionParticipantResolver {

	private final GroupParticipantRepository groupParticipantRepository;
	private final ClassUserRepository classUserRepository;

	/** 세션 참여 대상 학생 id 목록. 매니저는 리포트 발급 대상이 아니므로 학생만 담는다. */
	public List<Long> resolveStudentIds(Session session) {
		if (session.getGroupId() != null) {
			return groupParticipantRepository.findUserIdsByGroupIdAndUserRole(session.getGroupId(), UserRole.STUDENT);
		}
		return classUserRepository.findUserIdsByClassEntityIdAndUserRole(session.getClassId(), UserRole.STUDENT);
	}

	public boolean isParticipantStudent(Session session, Long userId) {
		return resolveStudentIds(session).contains(userId);
	}
}
