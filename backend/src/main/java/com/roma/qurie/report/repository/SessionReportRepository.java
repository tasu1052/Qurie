package com.roma.qurie.report.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.report.entity.SessionReport;

public interface SessionReportRepository extends JpaRepository<SessionReport, Long> {

    boolean existsBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);

    Optional<SessionReport> findBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);

    List<SessionReport> findByOrdinaryUserIdOrderByIssuedAtDesc(Long ordinaryUserId);

    /** 반에서 발급된 사용자의 세션 리포트 전부. 최종(유저) 리포트가 이 스냅샷들을 합산한다. */
    @Query("""
            select sr from SessionReport sr, Session s
            where sr.sessionId = s.id and s.classId = :classId and sr.ordinaryUserId = :userId
            """)
    List<SessionReport> findAllByClassIdAndOrdinaryUserId(
            @Param("classId") Long classId, @Param("userId") Long ordinaryUserId);
}
