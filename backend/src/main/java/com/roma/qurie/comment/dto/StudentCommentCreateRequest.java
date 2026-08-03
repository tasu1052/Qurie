package com.roma.qurie.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 학생 코멘트 작성 요청. 작성자는 요청 본문이 아니라 인증 정보에서 가져온다.
 * classId 는 권한 판정 기준이라 필수다 — 요청자와 대상 학생이 같은 반인지 이 값으로 확인한다.
 */
public record StudentCommentCreateRequest(
		@NotNull Long classId,
		@NotBlank @Size(max = 2000) String content) {
}
