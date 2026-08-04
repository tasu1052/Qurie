package com.roma.qurie.classes;

import com.roma.qurie.user.entity.UserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassUserRepository extends JpaRepository<ClassUser, Long> {

	boolean existsByClassEntityIdAndUserId(Long classId, Long userId);

	/** 반 인원 집계. 매니저도 명단에 있으므로 역할로 갈라야 학생 수와 강사 수가 분리된다. */
	long countByClassEntityIdAndUserRole(Long classId, UserRole role);

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

	/** 반 공개 세션의 참여 대상(학생) id 목록. 세션 리포트 발급 대상 해석에 쓴다. */
	@Query("select cu.user.id from ClassUser cu where cu.classEntity.id = :classId and cu.user.role = :role")
	List<Long> findUserIdsByClassEntityIdAndUserRole(@Param("classId") Long classId, @Param("role") UserRole role);

	/**
	 * 반 명단 페이지 조회. 회원 목록(UserRepository.findSummaries)과 같은 필터 계약(role·이름/이메일 검색)을 따른다.
	 * 정렬이 쿼리에 박혀 있으므로 호출부는 Pageable 의 Sort 를 버려야 한다 (UserService.toPageRequest 와 같은 이유).
	 */
	@Query(value = """
			select cu from ClassUser cu join fetch cu.user u
			where cu.classEntity.id = :classId
				and (:role is null or u.role = :role)
				and (:keyword is null
					or lower(u.name) like lower(concat('%', :keyword, '%'))
					or lower(u.email) like lower(concat('%', :keyword, '%')))
			order by u.name asc, u.id asc
			""",
			countQuery = """
			select count(cu.id) from ClassUser cu join cu.user u
			where cu.classEntity.id = :classId
				and (:role is null or u.role = :role)
				and (:keyword is null
					or lower(u.name) like lower(concat('%', :keyword, '%'))
					or lower(u.email) like lower(concat('%', :keyword, '%')))
			""")
	Page<ClassUser> findMemberPage(
			@Param("classId") Long classId,
			@Param("role") UserRole role,
			@Param("keyword") String keyword,
			Pageable pageable);
}
