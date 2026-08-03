package com.roma.qurie.report.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.report.entity.SessionReport;

public interface SessionReportRepository extends JpaRepository<SessionReport, Long> {

    boolean existsBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);

    Optional<SessionReport> findBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);

    List<SessionReport> findByOrdinaryUserIdOrderByIssuedAtDesc(Long ordinaryUserId);
}
