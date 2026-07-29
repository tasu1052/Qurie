package com.roma.qurie.classes;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    boolean existsByTrackIdAndClassNumber(Long trackId, int classNumber);

    /* 트랙 삭제 시 하위 클래스가 남아 있으면 막기 위한 검사 */
    boolean existsByTrackId(Long trackId);

    /*
     * 클래스 관리 목록. 기업 스코프를 강제하고 트랙·이름 필터는 선택이다.
     * 목록 기본 정렬(createdAt desc)이 쿼리에 들어 있으므로 Pageable 의 Sort 는 서비스에서 버린다.
     */
    @Query(value = """
            select c
            from ClassEntity c
            where c.track.enterprise.id = :enterpriseId
                and (:trackId is null or c.track.id = :trackId)
                and (:keyword is null or lower(c.name) like lower(concat('%', :keyword, '%')))
            order by c.createdAt desc
            """,
            countQuery = """
            select count(c.id)
            from ClassEntity c
            where c.track.enterprise.id = :enterpriseId
                and (:trackId is null or c.track.id = :trackId)
                and (:keyword is null or lower(c.name) like lower(concat('%', :keyword, '%')))
            """)
    Page<ClassEntity> findPage(
            @Param("enterpriseId") Long enterpriseId,
            @Param("trackId") Long trackId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /*
     * 진행 중인 클래스 수. 운영 기간이 정해지지 않은(started_at 이 null 인) 클래스는 아직 시작한 것으로
     * 볼 수 없어 세지 않고, 종료일이 없는 클래스는 계속 진행 중으로 본다.
     */
    @Query("""
            select count(c.id)
            from ClassEntity c
            where c.track.enterprise.id = :enterpriseId
                and c.startedAt is not null
                and c.startedAt <= :now
                and (c.endedAt is null or c.endedAt >= :now)
            """)
    long countActive(@Param("enterpriseId") Long enterpriseId, @Param("now") LocalDateTime now);
}
