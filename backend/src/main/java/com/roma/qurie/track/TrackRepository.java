package com.roma.qurie.track;

import com.roma.qurie.track.dto.TrackSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackRepository extends JpaRepository<Track, Long> {

    boolean existsByEnterpriseIdAndName(Long enterpriseId, String name);

    /* 이름 수정 시 자기 자신은 중복으로 치지 않기 위한 검사 */
    boolean existsByEnterpriseIdAndNameAndIdNot(Long enterpriseId, String name, Long id);

    long countByEnterpriseId(Long enterpriseId);

    /*
     * 클래스 수는 상관 서브쿼리로 센다. join + group by로 세면 나중에 세션 등 다른 컬렉션을 함께 집계할 때
     * 카티션 곱으로 개수가 부풀려지기 때문이다.
     * 정렬은 대시보드 트랙 현황이 요구하는 classCount desc로 고정한다.
     */
    @Query(
            value =
                    """
                    select new com.roma.qurie.track.dto.TrackSummaryResponse(
                            t.id, t.name, t.description, t.tech,
                            (select count(c.id) from ClassEntity c where c.track = t))
                    from Track t
                    where t.enterprise.id = :enterpriseId
                        and (:tech is null or t.tech = :tech)
                        and (:keyword is null or lower(t.name) like lower(concat('%', :keyword, '%')))
                    order by (select count(c2.id) from ClassEntity c2 where c2.track = t) desc, t.name asc
                    """,
            countQuery =
                    """
                    select count(t.id)
                    from Track t
                    where t.enterprise.id = :enterpriseId
                        and (:tech is null or t.tech = :tech)
                        and (:keyword is null or lower(t.name) like lower(concat('%', :keyword, '%')))
                    """)
    Page<TrackSummaryResponse> findSummaries(
            @Param("enterpriseId") Long enterpriseId,
            @Param("tech") String tech,
            @Param("keyword") String keyword,
            Pageable pageable);
}
