package com.roma.qurie.project.dto;

import com.roma.qurie.project.ProjectFile;

/** 파일 내용 응답. 편집기에서 파일을 열 때 사용한다. */
public record ProjectFileContentResponse(String path, String content) {

	public static ProjectFileContentResponse from(ProjectFile file) {
		return new ProjectFileContentResponse(file.getPath(), file.getContent());
	}
}
