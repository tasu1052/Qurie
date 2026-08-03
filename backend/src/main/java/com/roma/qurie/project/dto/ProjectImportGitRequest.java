package com.roma.qurie.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Git 저장소 임포트 요청. https 저장소만 지원한다.
 *
 * @param branch 생략하면 기본 브랜치
 * @param subPath 모노레포에서 하위 폴더만 가져올 때
 * @param pat 비공개 저장소용 개인 액세스 토큰. 이 요청의 clone 에만 쓰고 저장하지 않는다
 */
public record ProjectImportGitRequest(
		@NotNull Long sessionId,
		@NotBlank @Size(max = 500) String repoUrl,
		@Size(max = 100) String branch,
		@Size(max = 200) String subPath,
		@Size(max = 200) String pat) {

	/** 토큰이 로그·디버그 출력에 흘러가지 않도록 기본 toString 을 가린다. */
	@Override
	public String toString() {
		return "ProjectImportGitRequest[sessionId=" + sessionId + ", repoUrl=" + repoUrl
				+ ", branch=" + branch + ", subPath=" + subPath + ", pat=" + (pat == null ? "null" : "****") + "]";
	}
}
