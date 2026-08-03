package com.roma.qurie.comment;

import com.roma.qurie.comment.dto.StudentCommentCreateRequest;
import com.roma.qurie.comment.dto.StudentCommentResponse;
import com.roma.qurie.comment.dto.StudentCommentUpdateRequest;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StudentCommentController {

	private final StudentCommentService studentCommentService;

	/** 학생 코멘트 작성 (해당 반 MANAGER) */
	@PostMapping("/users/{userId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public StudentCommentResponse create(
			@PathVariable("userId") Long userId,
			@Valid @RequestBody StudentCommentCreateRequest request,
			@AuthenticationPrincipal AuthUser requester) {
		return studentCommentService.create(userId, request, requester);
	}

	/**
	 * 학생 코멘트 목록. classId 를 주면 그 반의 코멘트만(해당 반 MANAGER·MASTER),
	 * 생략하면 반 구분 없이 전부(MASTER 전용) 조회한다.
	 */
	@GetMapping("/users/{userId}/comments")
	public List<StudentCommentResponse> getComments(
			@PathVariable("userId") Long userId,
			@RequestParam(name = "classId", required = false) Long classId,
			@AuthenticationPrincipal AuthUser requester) {
		return studentCommentService.getComments(userId, classId, requester);
	}

	/** 코멘트 수정 (작성자 본인) */
	@PatchMapping("/comments/{commentId}")
	public StudentCommentResponse update(
			@PathVariable("commentId") Long commentId,
			@Valid @RequestBody StudentCommentUpdateRequest request,
			@AuthenticationPrincipal AuthUser requester) {
		return studentCommentService.update(commentId, request.content(), requester);
	}

	/** 코멘트 삭제 (작성자 본인 또는 MASTER) */
	@DeleteMapping("/comments/{commentId}")
	public ResponseEntity<Void> delete(
			@PathVariable("commentId") Long commentId, @AuthenticationPrincipal AuthUser requester) {
		studentCommentService.delete(commentId, requester);
		return ResponseEntity.noContent().build();
	}
}
