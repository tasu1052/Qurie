package com.roma.qurie.quiz.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;

public interface QuizSetRepository extends JpaRepository<QuizSet, Long> {

	List<QuizSet> findByProjectIdOrderByIdDesc(Long projectId);

	boolean existsByProjectIdAndStatusIn(Long projectId, Collection<QuizSetStatus> statuses);

	boolean existsByProjectIdAndSourcePathAndStatusIn(
			Long projectId, String sourcePath, Collection<QuizSetStatus> statuses);

	List<QuizSet> findByProjectIdAndSourcePathOrderByIdDesc(Long projectId, String sourcePath);
}
