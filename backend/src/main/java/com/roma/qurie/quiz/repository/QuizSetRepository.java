package com.roma.qurie.quiz.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.quiz.entity.QuizSet;

public interface QuizSetRepository extends JpaRepository<QuizSet, Long> {
}
