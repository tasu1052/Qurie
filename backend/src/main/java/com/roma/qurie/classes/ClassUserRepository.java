package com.roma.qurie.classes;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassUserRepository extends JpaRepository<ClassUser, Long> {

	boolean existsByClassEntityIdAndUserId(Long classId, Long userId);

	/**
	 * ClassResponse 가 track 까지 읽으므로 두 단계 모두 fetch join 한다.
	 */
	@Query("select cu from ClassUser cu join fetch cu.classEntity c join fetch c.track where cu.userId = :userId")
	List<ClassUser> findAllWithClassByUserId(@Param("userId") Long userId);
}
