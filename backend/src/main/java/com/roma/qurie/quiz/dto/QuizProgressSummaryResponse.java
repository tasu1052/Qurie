package com.roma.qurie.quiz.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizSet;

/** 학생 본인의 응시 현황. 응시 후 결과 화면에 쓴다. */
public record QuizProgressSummaryResponse(
		Long quizSetId,
		int totalCount,
		int attemptedCount,
		int correctCount,
		List<ProgressItem> items) {

	public static QuizProgressSummaryResponse from(QuizSet quizSet, List<QuizProgress> progresses) {
		Map<Long, QuizProgress> uniqueByQuizId = new LinkedHashMap<>();
		for (QuizProgress progress : progresses) {
			if (progress.getQuiz() == null || progress.getQuiz().getId() == null) {
				continue;
			}
			uniqueByQuizId.putIfAbsent(progress.getQuiz().getId(), progress);
		}
		List<QuizProgress> unique = new ArrayList<>(uniqueByQuizId.values());

		int attemptedCount = (int) unique.stream()
				.filter(progress -> progress.getStatus() == QuizProgressStatus.ATTEMPTED)
				.count();
		int correctCount = (int) unique.stream()
				.filter(progress -> Boolean.TRUE.equals(progress.getIsCorrect()))
				.count();

		return new QuizProgressSummaryResponse(
				quizSet.getId(),
				quizSet.getQuizzes().size(),
				attemptedCount,
				correctCount,
				unique.stream().map(ProgressItem::from).toList());
	}

	/** 응시 복원용. 제출 응답과 같이 해설·정답 인덱스를 포함한다. */
	public record ProgressItem(
			Long quizId,
			QuizProgressStatus status,
			Integer chosenChoiceIdx,
			Boolean isCorrect,
			long elapsedMs,
			String explanation,
			Integer correctChoiceIdx) {

		public static ProgressItem from(QuizProgress progress) {
			var quiz = progress.getQuiz();
			Integer correctIdx = null;
			if (quiz != null && quiz.getChoices() != null) {
				correctIdx = quiz.getChoices().stream()
						.filter(QuizChoice::isAnswer)
						.map(QuizChoice::getIdx)
						.findFirst()
						.orElse(null);
			}
			return new ProgressItem(
					quiz != null ? quiz.getId() : null,
					progress.getStatus(),
					progress.getChosenChoice() != null ? progress.getChosenChoice().getIdx() : null,
					progress.getIsCorrect(),
					progress.getElapsedMs(),
					quiz != null ? quiz.getExplanation() : null,
					correctIdx);
		}
	}
}
