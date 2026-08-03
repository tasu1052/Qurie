package com.roma.qurie.material.dto;

import java.time.LocalDateTime;

/** 목록 조회용 프로젝션. 파일 본문(LONGBLOB)을 끌고 오지 않기 위해 엔티티 대신 이걸 뽑는다. */
public record ClassMaterialSummary(
		Long id,
		Long classId,
		String fileName,
		String contentType,
		long byteSize,
		Long uploadedBy,
		LocalDateTime createdAt) {
}
