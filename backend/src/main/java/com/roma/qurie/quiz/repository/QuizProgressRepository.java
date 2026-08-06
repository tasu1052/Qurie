package com.roma.qurie.quiz.repository;

import java.util.Collection;
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

	/** 같은 출제 스코프(파일/폴더) 퀴즈셋만 지울 때 쓴다. */
	@Modifying
	@Query("""
			delete from QuizProgress qp
			where qp.quiz.quizSet.id in :quizSetIds
			""")
	void deleteAllByQuizSetIdIn(@Param("quizSetIds") Collection<Long> quizSetIds);

	/** READY 교체·여분 문항 정리 시 해당 문항 응시만 지운다. */
	@Modifying
	@Query("""
			delete from QuizProgress qp
			where qp.quiz.id in :quizIds
			""")
	void deleteAllByQuizIdIn(@Param("quizIds") Collection<Long> quizIds);

	/**
	 * choices 를 fetch 하면 보기 수만큼 행이 늘어나므로 distinct 로 QuizProgress 중복을 제거한다.
	 * (중복이 남으면 toMap(quizId) / 응시 건수 집계가 깨진다.)
	 */
	@Query("""
			select distinct qp from QuizProgress qp
			join fetch qp.quiz q
			left join fetch q.choices
			left join fetch qp.chosenChoice
			where q.quizSet.id = :quizSetId and qp.user.id = :userId
			""")
	List<QuizProgress> findAllWithQuizByQuizSetIdAndUserId(
			@Param("quizSetId") Long quizSetId, @Param("userId") Long userId);

	/** 사용자가 세트에서 제출(응시·스킵 포함)한 문항 수. 세트 완주 판정에 쓴다. */
	@Query("""
			select count(qp) from QuizProgress qp
			where qp.quiz.quizSet.id = :quizSetId and qp.user.id = :userId
			""")
	long countByQuizSetIdAndUserId(@Param("quizSetId") Long quizSetId, @Param("userId") Long userId);

	/** 세트 완주 인원 집계용 — 사용자별 제출 문항 수를 [userId, count] 행으로 준다. */
	@Query("""
			select qp.user.id, count(qp) from QuizProgress qp
			where qp.quiz.quizSet.id = :quizSetId
			group by qp.user.id
			""")
	List<Object[]> countProgressByQuizSetIdGroupByUser(@Param("quizSetId") Long quizSetId);

	@Query("""
			select qp from QuizProgress qp
			join fetch qp.quiz q
			left join fetch qp.chosenChoice
			where q.quizSet.id = :quizSetId and qp.user.id = :userId and qp.isCorrect = false
			""")
	List<QuizProgress> findIncorrectWithQuizByQuizSetIdAndUserId(
			@Param("quizSetId") Long quizSetId, @Param("userId") Long userId);

	/** 리포트 AI 피드백의 문항별 반 전체(cohort) 집계용 — 세트의 모든 사용자 응시 기록. */
	@Query("""
			select qp from QuizProgress qp
			join fetch qp.quiz q
			left join fetch qp.chosenChoice
			where q.quizSet.id = :quizSetId
			""")
	List<QuizProgress> findAllWithQuizByQuizSetId(@Param("quizSetId") Long quizSetId);
}
