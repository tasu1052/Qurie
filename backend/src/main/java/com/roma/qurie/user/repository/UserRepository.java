package com.roma.qurie.user.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.user.dto.UserSummaryResponse;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByEmail(String email);
	Optional<User> findByEmail(String email);

	/*
	 * 세션 운영 횟수는 상관 서브쿼리로 센다. join + group by 로 세면 이후 리포트 발급 수 같은 다른 집계를
	 * 같은 쿼리에 더할 때 카티션 곱으로 개수가 부풀려지기 때문이다.
	 * 정렬은 대시보드 매니저 활동이 요구하는 활동량 desc 로 고정한다.
	 */
	@Query(value = """
			select new com.roma.qurie.user.dto.UserSummaryResponse(
					u.id, u.name, u.email, u.role,
					(select count(recent.id) from Session recent
						where recent.createdBy = u.id and recent.createdAt >= :activitySince),
					(select max(latest.createdAt) from Session latest where latest.createdBy = u.id))
			from User u
			where u.enterpriseId = :enterpriseId
				and (:role is null or u.role = :role)
				and (:keyword is null
					or lower(u.name) like lower(concat('%', :keyword, '%'))
					or lower(u.email) like lower(concat('%', :keyword, '%')))
			order by (select count(ranked.id) from Session ranked
						where ranked.createdBy = u.id and ranked.createdAt >= :activitySince) desc,
					u.name asc
			""",
			countQuery = """
			select count(u.id)
			from User u
			where u.enterpriseId = :enterpriseId
				and (:role is null or u.role = :role)
				and (:keyword is null
					or lower(u.name) like lower(concat('%', :keyword, '%'))
					or lower(u.email) like lower(concat('%', :keyword, '%')))
			""")
	Page<UserSummaryResponse> findSummaries(
			@Param("enterpriseId") Long enterpriseId,
			@Param("role") UserRole role,
			@Param("keyword") String keyword,
			@Param("activitySince") LocalDateTime activitySince,
			Pageable pageable);
}
