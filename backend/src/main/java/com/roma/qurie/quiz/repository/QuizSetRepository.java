package com.roma.qurie.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.quiz.entity.QuizSet;

public interface QuizSetRepository extends JpaRepository<QuizSet, Long> {

	List<QuizSet> findByProjectIdOrderByIdDesc(Long projectId);
}
