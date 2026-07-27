package com.roma.qurie.report.repository;

import com.roma.qurie.report.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    boolean existsByOrdinaryUserIdAndClassId(Long ordinaryUserId, Long classId);
}
