package com.roma.qurie.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 코멘트 수정 요청. 내용만 바꿀 수 있고 대상 학생·반은 바뀌지 않는다. */
public record StudentCommentUpdateRequest(
		@NotBlank @Size(max = 2000) String content) {
}
