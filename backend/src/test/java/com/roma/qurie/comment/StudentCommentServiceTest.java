package com.roma.qurie.comment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.comment.dto.StudentCommentCreateRequest;
import com.roma.qurie.comment.dto.StudentCommentResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class StudentCommentServiceTest {

	private static final Long CLASS_ID = 3L;
	private static final Long STUDENT_ID = 20L;
	private static final AuthUser MANAGER =
			new AuthUser(10L, "MANAGER", 100L, "manager@qurie.com", "매니저", CLASS_ID);
	private static final AuthUser OTHER_MANAGER =
			new AuthUser(11L, "MANAGER", 100L, "other@qurie.com", "다른 매니저", CLASS_ID);
	private static final AuthUser STUDENT =
			new AuthUser(STUDENT_ID, "STUDENT", 100L, "student@qurie.com", "학생", CLASS_ID);
	private static final AuthUser MASTER =
			new AuthUser(1L, "MASTER", 100L, "master@qurie.com", "마스터", null);

	@Mock
	private StudentCommentRepository studentCommentRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private StudentCommentService studentCommentService;

	@Test
	void managerOfClassCanLeaveComment() {
		givenClassMember(MANAGER.id(), true);
		givenStudent(UserRole.STUDENT);
		givenClassMember(STUDENT_ID, true);
		given(studentCommentRepository.save(any(StudentComment.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		StudentCommentResponse response = studentCommentService.create(
				STUDENT_ID, new StudentCommentCreateRequest(CLASS_ID, "  과제 피드백 남깁니다  "), MANAGER);

		ArgumentCaptor<StudentComment> captor = ArgumentCaptor.forClass(StudentComment.class);
		verify(studentCommentRepository).save(captor.capture());
		StudentComment saved = captor.getValue();
		assertThat(saved.getOrdinaryUserId()).isEqualTo(STUDENT_ID);
		assertThat(saved.getClassId()).isEqualTo(CLASS_ID);
		assertThat(saved.getAuthorId()).isEqualTo(MANAGER.id());
		assertThat(saved.getAuthorName()).isEqualTo("매니저");
		assertThat(saved.getContent()).isEqualTo("과제 피드백 남깁니다");
		assertThat(response.content()).isEqualTo("과제 피드백 남깁니다");
	}

	@Test
	void studentCannotLeaveComment() {
		assertThatThrownBy(() -> studentCommentService.create(
				STUDENT_ID, new StudentCommentCreateRequest(CLASS_ID, "내용"), STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(studentCommentRepository, never()).save(any(StudentComment.class));
	}

	@Test
	void managerOfAnotherClassCannotLeaveComment() {
		givenClassMember(MANAGER.id(), false);

		assertThatThrownBy(() -> studentCommentService.create(
				STUDENT_ID, new StudentCommentCreateRequest(CLASS_ID, "내용"), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(studentCommentRepository, never()).save(any(StudentComment.class));
	}

	@Test
	void commentTargetMustBeStudentOfThatClass() {
		givenClassMember(MANAGER.id(), true);
		givenStudent(UserRole.STUDENT);
		givenClassMember(STUDENT_ID, false);

		assertThatThrownBy(() -> studentCommentService.create(
				STUDENT_ID, new StudentCommentCreateRequest(CLASS_ID, "내용"), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void commentTargetCannotBeManager() {
		givenClassMember(MANAGER.id(), true);
		givenStudent(UserRole.MANAGER);

		assertThatThrownBy(() -> studentCommentService.create(
				STUDENT_ID, new StudentCommentCreateRequest(CLASS_ID, "내용"), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	/** 학생에게 전달하는 피드백이므로 본인은 자기 코멘트를 읽을 수 있다. */
	@Test
	void studentCanReadOwnComments() {
		given(studentCommentRepository.findByOrdinaryUserIdAndClassIdOrderByIdDesc(STUDENT_ID, CLASS_ID))
				.willReturn(List.of(comment("피드백")));

		List<StudentCommentResponse> comments =
				studentCommentService.getComments(STUDENT_ID, CLASS_ID, STUDENT);

		assertThat(comments).singleElement()
				.extracting(StudentCommentResponse::content)
				.isEqualTo("피드백");
	}

	/** 반을 지정하지 않아도 본인 것은 볼 수 있다(내 피드백 전체 보기). */
	@Test
	void studentCanReadOwnCommentsAcrossClasses() {
		given(studentCommentRepository.findByOrdinaryUserIdOrderByIdDesc(STUDENT_ID))
				.willReturn(List.of(comment("피드백")));

		assertThat(studentCommentService.getComments(STUDENT_ID, null, STUDENT)).hasSize(1);
	}

	@Test
	void otherStudentCannotReadSomeoneElsesComments() {
		AuthUser otherStudent = new AuthUser(99L, "STUDENT", 100L, "other@qurie.com", "다른 학생", CLASS_ID);

		assertThatThrownBy(() -> studentCommentService.getComments(STUDENT_ID, CLASS_ID, otherStudent))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void authorCanUpdateOwnComment() {
		given(studentCommentRepository.findById(5L)).willReturn(Optional.of(comment("이전 내용")));

		StudentCommentResponse response = studentCommentService.update(5L, "  고친 내용  ", MANAGER);

		assertThat(response.content()).isEqualTo("고친 내용");
	}

	/** 작성자 이름은 그대로 남으므로 남이 내용을 바꾸면 위조가 된다 — 마스터도 수정은 못 한다. */
	@Test
	void othersCannotUpdateComment() {
		given(studentCommentRepository.findById(5L)).willReturn(Optional.of(comment("이전 내용")));

		assertThatThrownBy(() -> studentCommentService.update(5L, "고친 내용", MASTER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void managerOfClassReadsCommentsNewestFirst() {
		givenClassMember(MANAGER.id(), true);
		given(studentCommentRepository.findByOrdinaryUserIdAndClassIdOrderByIdDesc(STUDENT_ID, CLASS_ID))
				.willReturn(List.of(comment("두 번째"), comment("첫 번째")));

		List<StudentCommentResponse> comments =
				studentCommentService.getComments(STUDENT_ID, CLASS_ID, MANAGER);

		assertThat(comments).extracting(StudentCommentResponse::content).containsExactly("두 번째", "첫 번째");
	}

	@Test
	void managerMustSpecifyClassToListComments() {
		assertThatThrownBy(() -> studentCommentService.getComments(STUDENT_ID, null, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void authorCanDeleteOwnComment() {
		given(studentCommentRepository.findById(5L)).willReturn(Optional.of(comment("내용")));

		studentCommentService.delete(5L, MANAGER);

		verify(studentCommentRepository).delete(any(StudentComment.class));
	}

	@Test
	void otherManagerCannotDeleteSomeoneElsesComment() {
		given(studentCommentRepository.findById(5L)).willReturn(Optional.of(comment("내용")));

		assertThatThrownBy(() -> studentCommentService.delete(5L, OTHER_MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(StudentCommentServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(studentCommentRepository, never()).delete(any(StudentComment.class));
	}

	@Test
	void masterCanDeleteAnyComment() {
		given(studentCommentRepository.findById(5L)).willReturn(Optional.of(comment("내용")));

		studentCommentService.delete(5L, MASTER);

		verify(studentCommentRepository).delete(any(StudentComment.class));
	}

	private StudentComment comment(String content) {
		return new StudentComment(STUDENT_ID, CLASS_ID, MANAGER.id(), MANAGER.name(), content);
	}

	private void givenClassMember(Long userId, boolean member) {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, userId)).willReturn(member);
	}

	private void givenStudent(UserRole role) {
		User user = User.builder()
				.enterpriseId(100L)
				.email("student@qurie.com")
				.role(role)
				.password("hashed")
				.name("학생")
				.build();
		given(userRepository.findById(STUDENT_ID)).willReturn(Optional.of(user));
	}

	private static HttpStatus statusOf(Throwable throwable) {
		return (HttpStatus)((ResponseStatusException)throwable).getStatusCode();
	}
}
