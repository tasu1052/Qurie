package com.roma.qurie.quiz.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.quiz.entity.Quiz;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	/** 문항이 그 퀴즈셋 소속이 맞는지 함께 검증하기 위해 quizSetId 를 같이 받는다. */
	Optional<Quiz> findByIdAndQuizSetId(Long id, Long quizSetId);

	/** 리포트 AI 피드백용 — 세트의 문항을 보기까지 채워 출제 순서대로 가져온다. */
	@Query("""
			select distinct q from Quiz q
			left join fetch q.choices
			where q.quizSet.id = :quizSetId
			order by q.orderNo
			""")
	List<Quiz> findAllWithChoicesByQuizSetId(@Param("quizSetId") Long quizSetId);
}
