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

    /** 리포트 재발급 시 기존 스냅샷을 새 것으로 대체하기 위해 지운다. */
    void deleteBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);

    /** 세션 삭제 시 함께 지운다 — 고아 리포트가 남으면 목록(전체)과 최종 리포트 집계(세션 조인)가 어긋난다. */
    void deleteBySessionId(Long sessionId);

    /**
     * 사용자의 세션 리포트 목록. 세션 조인으로 삭제된 세션의 고아 리포트를 걸러
     * 최종 리포트 집계(findAllByClassIdAndOrdinaryUserId)와 같은 모집단을 보게 한다.
     */
    @Query("""
            select sr from SessionReport sr, Session s
            where sr.sessionId = s.id and sr.ordinaryUserId = :userId
            order by sr.issuedAt desc
            """)
    List<SessionReport> findAllWithSessionByOrdinaryUserId(@Param("userId") Long ordinaryUserId);

    List<SessionReport> findBySessionIdOrderByIssuedAtDesc(Long sessionId);

    /** 반에서 발급된 사용자의 세션 리포트 전부. 최종(유저) 리포트가 이 스냅샷들을 합산한다. */
    @Query("""
            select sr from SessionReport sr, Session s
            where sr.sessionId = s.id and s.classId = :classId and sr.ordinaryUserId = :userId
            """)
    List<SessionReport> findAllByClassIdAndOrdinaryUserId(
            @Param("classId") Long classId, @Param("userId") Long ordinaryUserId);
}
