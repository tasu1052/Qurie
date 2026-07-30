package com.roma.qurie.project.dto;

import java.util.List;

import com.roma.qurie.project.ImportedFileSanitizer.SkippedFile;
import com.roma.qurie.project.Project;

/**
 * 임포트 결과. skippedFiles 는 걸러진 파일과 이유 — 사용자가 "왜 안 올라갔는지" 화면에서 확인한다.
 * versionHash 는 저장된 파일 내용의 SHA-256 으로, 퀴즈 생성 요청의 version_hash 에 그대로 쓸 수 있다.
 */
public record ProjectImportResponse(
		Long projectId,
		Long sessionId,
		int fileCount,
		String versionHash,
		List<SkippedFileResponse> skippedFiles) {

	public static ProjectImportResponse of(Project project, int fileCount, String versionHash,
			List<SkippedFile> skippedFiles) {
		return new ProjectImportResponse(
				project.getId(),
				project.getSessionId(),
				fileCount,
				versionHash,
				skippedFiles.stream().map(file -> new SkippedFileResponse(file.path(), file.reason())).toList());
	}

	public record SkippedFileResponse(String path, String reason) {
	}
}
