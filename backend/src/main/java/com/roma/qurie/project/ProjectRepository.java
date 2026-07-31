package com.roma.qurie.project;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    /** 세션의 "현재 프로젝트". 재임포트가 쌓이면 가장 최근 것이 기준이 된다. */
    Optional<Project> findFirstBySessionIdOrderByIdDesc(Long sessionId);
}
