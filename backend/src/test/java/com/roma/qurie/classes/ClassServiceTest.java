package com.roma.qurie.classes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.dto.ClassMemberResponse;
import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.group.Group;
import com.roma.qurie.group.GroupParticipant;
import com.roma.qurie.group.GroupParticipantRepository;
import com.roma.qurie.group.GroupParticipantRole;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;

@ExtendWith(MockitoExtension.class)
class ClassServiceTest {

	private static final Long ENTERPRISE_ID = 1L;
	private static final Long OTHER_ENTERPRISE_ID = 2L;
	private static final Long CLASS_ID = 5L;
	private static final Long OTHER_CLASS_ID = 6L;
	private static final Long GROUP_ID = 30L;
	private static final Pageable PAGEABLE = PageRequest.of(0, 20);

	@Mock
	private ClassRepository classRepository;

	@Mock
	private TrackRepository trackRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private GroupRepository groupRepository;

	@Mock
	private GroupParticipantRepository groupParticipantRepository;

	@InjectMocks
	private ClassService classService;

	@Test
	void getMembersMergesGroupAssignmentIntoRoster() {
		User assigned = student(101L, "박민수", "minsu@qurie.com");
		User unassigned = student(102L, "이수진", "sujin@qurie.com");
		ClassEntity classEntity = classEntity(ENTERPRISE_ID);
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity));
		given(classUserRepository.findMemberPage(CLASS_ID, UserRole.STUDENT, null, PAGEABLE))
				.willReturn(new PageImpl<>(List.of(
						new ClassUser(classEntity, assigned),
						new ClassUser(classEntity, unassigned)), PAGEABLE, 2));
		given(groupParticipantRepository.findAllWithGroupAndUserByClassId(CLASS_ID))
				.willReturn(List.of(participant(1L, group("그룹 A"), assigned)));

		PageResponse<ClassMemberResponse> response =
				classService.getMembers(managerOfClass(CLASS_ID), CLASS_ID, UserRole.STUDENT, null, PAGEABLE);

		assertThat(response.meta().total()).isEqualTo(2);
		ClassMemberResponse first = response.data().get(0);
		assertThat(first.userId()).isEqualTo(101L);
		assertThat(first.groupId()).isEqualTo(GROUP_ID);
		assertThat(first.groupName()).isEqualTo("그룹 A");
		ClassMemberResponse second = response.data().get(1);
		assertThat(second.userId()).isEqualTo(102L);
		assertThat(second.groupId()).isNull();
		assertThat(second.groupName()).isNull();
	}

	@Test
	void getMembersKeepsLatestAssignmentWhenUserHasDuplicateGroupRows() {
		User assigned = student(101L, "박민수", "minsu@qurie.com");
		ClassEntity classEntity = classEntity(ENTERPRISE_ID);
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity));
		given(classUserRepository.findMemberPage(CLASS_ID, null, null, PAGEABLE))
				.willReturn(new PageImpl<>(List.of(new ClassUser(classEntity, assigned)), PAGEABLE, 1));
		Group older = group("그룹 A");
		Group newer = group("그룹 B");
		ReflectionTestUtils.setField(newer, "id", GROUP_ID + 1);
		given(groupParticipantRepository.findAllWithGroupAndUserByClassId(CLASS_ID))
				.willReturn(List.of(
						participant(2L, newer, assigned),
						participant(1L, older, assigned)));

		PageResponse<ClassMemberResponse> response =
				classService.getMembers(masterOf(ENTERPRISE_ID), CLASS_ID, null, null, PAGEABLE);

		assertThat(response.data().get(0).groupName()).isEqualTo("그룹 B");
	}

	@Test
	void getMembersThrowsForbiddenWhenManagerIsNotInChargeOfTheClass() {
		assertThatThrownBy(() -> classService.getMembers(
				managerOfClass(OTHER_CLASS_ID), CLASS_ID, UserRole.STUDENT, null, PAGEABLE))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(classUserRepository, never()).findMemberPage(any(), any(), any(), any());
	}

	@Test
	void getMembersThrowsForbiddenWhenRequesterIsStudent() {
		AuthUser student = new AuthUser(
				7L, UserRole.STUDENT.name(), ENTERPRISE_ID, "student@qurie.com", "학생", CLASS_ID);

		assertThatThrownBy(() -> classService.getMembers(student, CLASS_ID, null, null, PAGEABLE))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void getMembersThrowsUnauthorizedWhenNotAuthenticated() {
		assertThatThrownBy(() -> classService.getMembers(null, CLASS_ID, null, null, PAGEABLE))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassServiceTest::statusOf)
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void getMembersThrowsNotFoundWhenClassBelongsToAnotherEnterprise() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(OTHER_ENTERPRISE_ID)));

		assertThatThrownBy(() -> classService.getMembers(
				masterOf(ENTERPRISE_ID), CLASS_ID, null, null, PAGEABLE))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ClassServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}

	private AuthUser masterOf(Long enterpriseId) {
		return new AuthUser(1L, "MASTER", enterpriseId, "master@qurie.com", "마스터", null);
	}

	private AuthUser managerOfClass(Long classId) {
		return new AuthUser(2L, UserRole.MANAGER.name(), ENTERPRISE_ID, "manager@qurie.com", "매니저", classId);
	}

	private ClassEntity classEntity(Long enterpriseId) {
		Enterprise enterprise = new Enterprise("SSAFY");
		ReflectionTestUtils.setField(enterprise, "id", enterpriseId);
		ClassEntity classEntity = ClassEntity.builder()
				.track(new Track(enterprise, "Java 트랙", null, "JAVA"))
				.classNumber(1)
				.name("서울 1반")
				.build();
		ReflectionTestUtils.setField(classEntity, "id", CLASS_ID);
		return classEntity;
	}

	private User student(Long id, String name, String email) {
		User user = User.builder()
				.enterpriseId(ENTERPRISE_ID)
				.email(email)
				.role(UserRole.STUDENT)
				.password("{bcrypt}encoded")
				.name(name)
				.build();
		ReflectionTestUtils.setField(user, "id", id);
		return user;
	}

	private Group group(String name) {
		Group group = Group.builder().classId(CLASS_ID).name(name).build();
		ReflectionTestUtils.setField(group, "id", GROUP_ID);
		return group;
	}

	private GroupParticipant participant(Long id, Group group, User user) {
		GroupParticipant participant = new GroupParticipant(group, user, GroupParticipantRole.PARTICIPANT);
		ReflectionTestUtils.setField(participant, "id", id);
		return participant;
	}
}
