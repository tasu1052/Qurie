package com.roma.qurie.material;

import com.roma.qurie.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 강의자료 엔티티. 강사가 반에 올린 파일을 학생이 목록으로 보고 내려받는다.
 *
 * 파일 본문은 DB(LONGBLOB)에 둔다 — 백엔드 컨테이너 파일시스템은 재배포마다 사라지고
 * S3 연동은 아직 없어서, 유일하게 영속인 저장소가 mysql 볼륨이기 때문이다. 파일당 상한(30MB)은
 * 서비스에서 강제한다. class_id 는 다른 엔티티들과 같은 이유로 FK 값(Long)으로만 보관한다.
 */
@Entity
@Table(
		name = "class_materials",
		indexes = @Index(name = "idx_class_material_class", columnList = "class_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClassMaterial extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "class_id", nullable = false)
	private Long classId;

	/** 업로드 당시의 원본 파일명. 경로 구분자는 저장 전에 제거된다. */
	@Column(name = "file_name", nullable = false, length = 255)
	private String fileName;

	@Column(name = "content_type", nullable = false, length = 100)
	private String contentType;

	@Column(name = "byte_size", nullable = false)
	private long byteSize;

	@Lob
	@Column(name = "data", nullable = false, columnDefinition = "LONGBLOB")
	private byte[] data;

	@Column(name = "uploaded_by", nullable = false)
	private Long uploadedBy;

	public ClassMaterial(Long classId, String fileName, String contentType, byte[] data, Long uploadedBy) {
		this.classId = classId;
		this.fileName = fileName;
		this.contentType = contentType;
		this.byteSize = data.length;
		this.data = data;
		this.uploadedBy = uploadedBy;
	}
}
