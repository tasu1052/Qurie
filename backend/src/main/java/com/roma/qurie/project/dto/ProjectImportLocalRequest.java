package com.roma.qurie.project.dto;

import java.util.Map;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * 로컬 폴더 임포트 요청. 프론트가 폴더 선택(webkitDirectory)으로 읽은 파일들을
 * {상대경로: 내용} 으로 담아 보낸다 — 서버는 사용자 PC 경로에 접근할 수 없으므로 내용이 직접 와야 한다.
 */
public record ProjectImportLocalRequest(
		@NotNull Long sessionId,
		@NotEmpty Map<String, String> files) {
}
