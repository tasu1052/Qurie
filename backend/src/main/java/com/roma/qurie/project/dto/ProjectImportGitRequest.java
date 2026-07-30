package com.roma.qurie.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Git 저장소 임포트 요청. 공개 https 저장소만 지원한다.
 *
 * @param branch 생략하면 기본 브랜치
 * @param subPath 모노레포에서 하위 폴더만 가져올 때
 */
public record ProjectImportGitRequest(
		@NotNull Long sessionId,
		@NotBlank @Size(max = 500) String repoUrl,
		@Size(max = 100) String branch,
		@Size(max = 200) String subPath) {
}
