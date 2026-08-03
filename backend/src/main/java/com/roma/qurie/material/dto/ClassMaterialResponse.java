package com.roma.qurie.material.dto;

import java.time.LocalDateTime;

import com.roma.qurie.material.ClassMaterial;

public record ClassMaterialResponse(
		Long id,
		Long classId,
		String fileName,
		String contentType,
		long byteSize,
		Long uploadedBy,
		String uploaderName,
		LocalDateTime createdAt) {

	public static ClassMaterialResponse of(ClassMaterialSummary summary, String uploaderName) {
		return new ClassMaterialResponse(
				summary.id(),
				summary.classId(),
				summary.fileName(),
				summary.contentType(),
				summary.byteSize(),
				summary.uploadedBy(),
				uploaderName,
				summary.createdAt());
	}

	public static ClassMaterialResponse of(ClassMaterial material, String uploaderName) {
		return new ClassMaterialResponse(
				material.getId(),
				material.getClassId(),
				material.getFileName(),
				material.getContentType(),
				material.getByteSize(),
				material.getUploadedBy(),
				uploaderName,
				material.getCreatedAt());
	}
}
