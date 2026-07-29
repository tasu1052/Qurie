package com.roma.qurie.classes;

import com.roma.qurie.user.entity.UserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassUserRepository extends JpaRepository<ClassUser, Long> {

	boolean existsByClassEntityIdAndUserId(Long classId, Long userId);

	/**
	 * 로그인 시 토큰에 담을 소속 반 조회용. 반은 한 사람당 하나가 요구사항이지만 스키마는 여러 행을
	 * 허용하므로, 데이터가 어긋나 있어도 최신 배정 하나로 결정되도록 정렬을 못박는다.
	 */
	Optional<ClassUser> findFirstByUserIdOrderByIdDesc(Long userId);

	/**
	 * ClassResponse 가 track 까지 읽으므로 두 단계 모두 fetch join 한다.
	 */
	@Query("select cu from ClassUser cu join fetch cu.classEntity c join fetch c.track where cu.user.id = :userId")
	List<ClassUser> findAllWithClassByUserId(@Param("userId") Long userId);

	/** 클래스 삭제 시 명단을 함께 정리한다. 명단은 클래스에 종속된 데이터라 남겨둘 이유가 없다. */
	void deleteByClassEntityId(Long classId);

	/**
	 * 반 명단을 역할로 걸러 조회한다. 그룹 배정 후보·랜덤 배정 대상은 학생뿐이다 —
	 * 매니저도 반 명단(class_users)에 있으므로 role 필터 없이 쓰면 매니저가 그룹에 섞여 들어간다.
	 */
	@Query("select cu from ClassUser cu join fetch cu.user u where cu.classEntity.id = :classId and u.role = :role")
	List<ClassUser> findAllWithUserByClassEntityIdAndRole(
			@Param("classId") Long classId, @Param("role") UserRole role);
}
