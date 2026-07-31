package com.roma.qurie.comment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentCommentRepository extends JpaRepository<StudentComment, Long> {

	/** 학생 상세의 코멘트 이력. 최근 코멘트가 위에 오도록 고정한다. */
	List<StudentComment> findByOrdinaryUserIdAndClassIdOrderByIdDesc(Long ordinaryUserId, Long classId);

	List<StudentComment> findByOrdinaryUserIdOrderByIdDesc(Long ordinaryUserId);
}
