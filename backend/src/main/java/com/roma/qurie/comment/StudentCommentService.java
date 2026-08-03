package com.roma.qurie.comment;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.comment.dto.StudentCommentCreateRequest;
import com.roma.qurie.comment.dto.StudentCommentResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 학생 코멘트. 강사가 학생 상세 화면에서 남기는 사람 작성 기록이다.
 *
 * 학생에게 전달하는 피드백이므로 본인은 자기 코멘트를 읽을 수 있다 — 작성·수정·삭제는 강사만 한다.
 */
@Service
@RequiredArgsConstructor
public class StudentCommentService {

	private static final String MASTER_ROLE = "MASTER";
	private static final String MANAGER_ROLE = "MANAGER";

	private final StudentCommentRepository studentCommentRepository;
	private final ClassUserRepository classUserRepository;
	private final UserRepository userRepository;

	@Transactional
	public StudentCommentResponse create(Long studentId, StudentCommentCreateRequest request, AuthUser author) {
		requireManagerOfClass(request.classId(), author);
		requireStudentOfClass(studentId, request.classId());

		StudentComment comment = new StudentComment(
				studentId,
				request.classId(),
				author.id(),
				author.name(),
				request.content().trim());
		return StudentCommentResponse.from(studentCommentRepository.save(comment));
	}

	@Transactional(readOnly = true)
	public List<StudentCommentResponse> getComments(Long studentId, Long classId, AuthUser requester) {
		if (classId == null) {
			requireSelfOrMaster(studentId, requester);
			return studentCommentRepository.findByOrdinaryUserIdOrderByIdDesc(studentId).stream()
					.map(StudentCommentResponse::from)
					.toList();
		}
		requireCommentViewer(studentId, classId, requester);
		return studentCommentRepository.findByOrdinaryUserIdAndClassIdOrderByIdDesc(studentId, classId).stream()
				.map(StudentCommentResponse::from)
				.toList();
	}

	/**
	 * 코멘트 수정. 작성자 본인만 할 수 있다 — 작성자 이름은 그대로 남기 때문에 남이 내용을 바꾸면 위조가 된다.
	 * 마스터도 수정하지 못하고 삭제만 할 수 있는 이유가 이것이다.
	 */
	@Transactional
	public StudentCommentResponse update(Long commentId, String content, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		StudentComment comment = findCommentOrThrow(commentId);
		if (!comment.getAuthorId().equals(requester.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 코멘트만 수정할 수 있습니다.");
		}
		comment.changeContent(content.trim());
		return StudentCommentResponse.from(comment);
	}

	/** 삭제는 작성자 본인과 마스터만 할 수 있다. 같은 반 다른 강사가 남의 코멘트를 지우지 못하게 한다. */
	@Transactional
	public void delete(Long commentId, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		StudentComment comment = findCommentOrThrow(commentId);
		boolean isAuthor = comment.getAuthorId().equals(requester.id());
		if (!isAuthor && !MASTER_ROLE.equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 코멘트만 삭제할 수 있습니다.");
		}
		studentCommentRepository.delete(comment);
	}

	private void requireManagerOfClass(Long classId, AuthUser author) {
		if (author == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (!MANAGER_ROLE.equals(author.role())
				|| !classUserRepository.existsByClassEntityIdAndUserId(classId, author.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 반의 강사만 코멘트를 남길 수 있습니다.");
		}
	}

	/** 학생 본인, 마스터, 그리고 그 반의 강사가 코멘트를 볼 수 있다. */
	private void requireCommentViewer(Long studentId, Long classId, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (requester.id().equals(studentId) || MASTER_ROLE.equals(requester.role())) {
			return;
		}
		if (!MANAGER_ROLE.equals(requester.role())
				|| !classUserRepository.existsByClassEntityIdAndUserId(classId, requester.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "코멘트를 조회할 권한이 없습니다.");
		}
	}

	/**
	 * 반을 지정하지 않은 조회는 여러 반의 코멘트를 한 번에 내주므로 본인과 마스터로 제한한다 —
	 * 강사는 자기 반 코멘트만 볼 수 있어야 해서 classId 를 반드시 지정해야 한다.
	 */
	private void requireSelfOrMaster(Long studentId, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (requester.id().equals(studentId) || MASTER_ROLE.equals(requester.role())) {
			return;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "반을 지정해야 코멘트를 조회할 수 있습니다.");
	}

	private StudentComment findCommentOrThrow(Long commentId) {
		return studentCommentRepository.findById(commentId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "코멘트를 찾을 수 없습니다: " + commentId));
	}

	/** 코멘트 대상은 그 반에 실제로 배정된 학생이어야 한다. 매니저에게 코멘트를 남기는 경로도 함께 막힌다. */
	private void requireStudentOfClass(Long studentId, Long classId) {
		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + studentId));
		if (student.getRole() != UserRole.STUDENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "학생에게만 코멘트를 남길 수 있습니다.");
		}
		if (!classUserRepository.existsByClassEntityIdAndUserId(classId, studentId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이 반에 속한 학생이 아닙니다.");
		}
	}
}
