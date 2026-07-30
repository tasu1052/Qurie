package com.roma.qurie.project;

import com.roma.qurie.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 임포트된 프로젝트의 파일 하나. 세션 편집기 파일 트리와 퀴즈 생성(AI 에 보낼 코드)의 원본이 된다.
 *
 * 내용은 텍스트만 저장한다 — 편집기·퀴즈 모두 텍스트만 다루고, 바이너리는 임포트 단계에서 걸러진다.
 * MySQL TEXT 는 64KB 라 파일당 상한(200KB)을 못 담아 MEDIUMTEXT 로 둔다.
 */
@Entity
@Table(
		name = "project_files",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_project_file_path",
				columnNames = {"project_id", "path"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectFile extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "project_id", nullable = false)
	private Long projectId;

	@Column(name = "path", nullable = false, length = 500)
	private String path;

	@Column(name = "content", nullable = false, columnDefinition = "mediumtext")
	private String content;

	/** UTF-8 인코딩 기준 바이트 수. 파일 트리에 내용 없이 크기를 보여주기 위해 저장 시 계산해 둔다. */
	@Column(name = "byte_size", nullable = false)
	private long byteSize;

	public ProjectFile(Long projectId, String path, String content, long byteSize) {
		this.projectId = projectId;
		this.path = path;
		this.content = content;
		this.byteSize = byteSize;
	}
}
