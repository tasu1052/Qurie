package com.roma.qurie.quiz.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roma.qurie.quiz.entity.QuizProgress;

public interface QuizProgressRepository extends JpaRepository<QuizProgress, Long> {

	boolean existsByQuizIdAndUserId(Long quizId, Long userId);

	/** 퀴즈 재생성 시 이전 문항의 응시 기록을 일괄 삭제한다. 문항(quiz)에 FK 가 걸려 있어 문항보다 먼저 지워야 한다. */
	@Modifying
	@Query("""
			delete from QuizProgress qp
			where qp.quiz.id in (select q.id from Quiz q where q.quizSet.projectId = :projectId)
			""")
	void deleteAllByQuizSetProjectId(@Param("projectId") Long projectId);

	@Query("""
			select qp from QuizProgress qp
			join fetch qp.quiz q
			left join fetch qp.chosenChoice
			where q.quizSet.id = :quizSetId and qp.user.id = :userId
			""")
	List<QuizProgress> findAllWithQuizByQuizSetIdAndUserId(
			@Param("quizSetId") Long quizSetId, @Param("userId") Long userId);
}
