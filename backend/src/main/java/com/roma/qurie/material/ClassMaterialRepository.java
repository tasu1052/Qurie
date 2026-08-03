package com.roma.qurie.material;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.material.dto.ClassMaterialSummary;

public interface ClassMaterialRepository extends JpaRepository<ClassMaterial, Long> {

	/**
	 * 목록용 조회. 파일 본문(LONGBLOB)까지 끌고 오면 목록 한 번에 수백 MB 를 읽을 수 있어
	 * 메타데이터만 뽑는다. 최신 업로드가 먼저 보이도록 내림차순.
	 */
	@Query("""
			select new com.roma.qurie.material.dto.ClassMaterialSummary(
				m.id, m.classId, m.fileName, m.contentType, m.byteSize, m.uploadedBy, m.createdAt)
			from ClassMaterial m where m.classId = :classId order by m.id desc
			""")
	List<ClassMaterialSummary> findSummariesByClassId(@Param("classId") Long classId);
}
