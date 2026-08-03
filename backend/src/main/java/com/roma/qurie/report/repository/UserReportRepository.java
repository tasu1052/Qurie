package com.roma.qurie.report.repository;

import com.roma.qurie.report.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    boolean existsByOrdinaryUserIdAndClassId(Long ordinaryUserId, Long classId);

    Optional<UserReport> findByOrdinaryUserIdAndClassId(Long ordinaryUserId, Long classId);

    /**
     * 반 단위 학습 지표. 리포트가 없으면 평균은 null 로 나오고 count 만 0 이다 —
     * 호출부가 "집계할 데이터가 없음"과 "정답률 0%"를 구분할 수 있어야 한다.
     */
    @Query("""
            select count(r.id) as reportedStudentCount,
                   avg(r.accuracy) as avgAccuracy,
                   avg(r.completionRate) as avgCompletionRate,
                   avg(r.avgElapsedMs) as avgElapsedMs
            from UserReport r
            where r.classId = :classId
            """)
    ClassReportSummary summarizeByClassId(@Param("classId") Long classId);

    /** 위 집계 쿼리의 투영. JPA 의 avg 는 Double 을 돌려준다. */
    interface ClassReportSummary {

        long getReportedStudentCount();

        Double getAvgAccuracy();

        Double getAvgCompletionRate();

        Double getAvgElapsedMs();
    }
}
