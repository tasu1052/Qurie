package com.roma.qurie.classes;

import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    boolean existsByTrackIdAndClassNumber(Long trackId, int classNumber);

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
