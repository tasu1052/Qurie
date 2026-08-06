package com.roma.qurie.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.quiz.entity.QuizSatisfaction;

public interface QuizSatisfactionRepository extends JpaRepository<QuizSatisfaction, Long> {

	Optional<QuizSatisfaction> findByQuizSetIdAndUserId(Long quizSetId, Long userId);

	boolean existsByQuizSetIdAndUserId(Long quizSetId, Long userId);
}
