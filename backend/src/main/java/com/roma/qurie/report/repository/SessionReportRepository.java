package com.roma.qurie.report.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.report.entity.SessionReport;

public interface SessionReportRepository extends JpaRepository<SessionReport, Long> {

    boolean existsBySessionIdAndOrdinaryUserId(Long sessionId, Long ordinaryUserId);
}
