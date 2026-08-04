package com.roma.qurie.quiz.dto;

import java.util.List;

import com.roma.qurie.quiz.dto.QuizProgressSummaryResponse.ProgressItem;
import com.roma.qurie.quiz.entity.QuizProgress;

/** 학생 본인의 오답 목록. 오답 복습 화면에 쓴다. */
public record QuizIncorrectProgressResponse(Long quizSetId, int incorrectCount, List<ProgressItem> items) {

	public static QuizIncorrectProgressResponse from(Long quizSetId, List<QuizProgress> incorrectProgresses) {
		List<ProgressItem> items = incorrectProgresses.stream().map(ProgressItem::from).toList();
		return new QuizIncorrectProgressResponse(quizSetId, items.size(), items);
	}
}
