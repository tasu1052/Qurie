package com.roma.qurie.quiz.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roma.qurie.quiz.entity.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	/** 문항이 그 퀴즈셋 소속이 맞는지 함께 검증하기 위해 quizSetId 를 같이 받는다. */
	Optional<Quiz> findByIdAndQuizSetId(Long id, Long quizSetId);
}
