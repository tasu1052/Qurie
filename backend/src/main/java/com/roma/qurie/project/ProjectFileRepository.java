package com.roma.qurie.project;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.project.dto.ProjectFileSummaryResponse;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {

	/**
	 * 파일 트리용 목록. content(최대 200KB×500개)까지 끌고 오면 목록 조회가 무거워지므로
	 * 경로와 크기만 뽑는다.
	 */
	@Query("""
			select new com.roma.qurie.project.dto.ProjectFileSummaryResponse(f.path, f.byteSize)
			from ProjectFile f where f.projectId = :projectId order by f.path asc
			""")
	List<ProjectFileSummaryResponse> findSummariesByProjectId(@Param("projectId") Long projectId);

	Optional<ProjectFile> findByProjectIdAndPath(Long projectId, String path);

	List<ProjectFile> findAllByProjectId(Long projectId);
}
