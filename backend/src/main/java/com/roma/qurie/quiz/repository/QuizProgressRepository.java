package com.roma.qurie.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.quiz.entity.QuizProgress;

public interface QuizProgressRepository extends JpaRepository<QuizProgress, Long> {

	boolean existsByQuizIdAndUserId(Long quizId, Long userId);

	@Query("""
			select qp from QuizProgress qp
			join fetch qp.quiz q
			left join fetch q.choices
			left join fetch qp.chosenChoice
			where q.quizSet.id = :quizSetId and qp.user.id = :userId
			""")
	List<QuizProgress> findAllWithQuizByQuizSetIdAndUserId(
			@Param("quizSetId") Long quizSetId, @Param("userId") Long userId);
}
