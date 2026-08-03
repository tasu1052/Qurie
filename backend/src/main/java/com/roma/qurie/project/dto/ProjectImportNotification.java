package com.roma.qurie.project.dto;

/**
 * 세션 프로젝트 임포트 완료를 `/topic/sessions/{id}/project` 로 알릴 때 담는 payload.
 * 참가자는 이 이벤트로 projects.bySession 캐시를 갱신해 파일 트리를 맞춘다.
 */
public record ProjectImportNotification(
		Long projectId,
		Long sessionId,
		int fileCount,
		String versionHash) {

	public static ProjectImportNotification from(ProjectImportResponse response) {
		return new ProjectImportNotification(
				response.projectId(),
				response.sessionId(),
				response.fileCount(),
				response.versionHash());
	}
}
