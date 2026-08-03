package com.roma.qurie.comment.dto;

import com.roma.qurie.comment.StudentComment;
import java.time.LocalDateTime;

public record StudentCommentResponse(
		Long id,
		Long ordinaryUserId,
		Long classId,
		Long authorId,
		String authorName,
		String content,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {

	public static StudentCommentResponse from(StudentComment comment) {
		return new StudentCommentResponse(
				comment.getId(),
				comment.getOrdinaryUserId(),
				comment.getClassId(),
				comment.getAuthorId(),
				comment.getAuthorName(),
				comment.getContent(),
				comment.getCreatedAt(),
				comment.getUpdatedAt());
	}
}
