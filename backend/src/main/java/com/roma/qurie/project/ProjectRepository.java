package com.roma.qurie.project;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

	Optional<Project> findTopBySessionIdOrderByIdDesc(Long sessionId);
}
