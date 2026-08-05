package com.roma.qurie.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 파일 내용 저장 요청. 세션 편집기(Yjs 공유 문서)의 편집본을 스냅샷 DB에 반영해,
 * 이후 퀴즈 생성이 편집된 코드를 기준으로 하게 한다.
 */
public record ProjectFileUpdateRequest(
		@NotBlank @Size(max = 500) String path,
		@NotNull String content) {
}
