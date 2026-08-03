package com.roma.qurie.quiz.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

import com.roma.qurie.quiz.entity.QuizProgressStatus;

/**
 * 문항 응시 결과 제출. status=ATTEMPTED 일 때만 chosenChoiceIdx 가 필요하다.
 * chosenChoiceIdx 는 QuizQuestionsResponse 가 내려준 idx(0~3) 다 — 학생 화면은 보기의 실제 DB id 를 모른다.
 */
public record QuizProgressSubmitRequest(
		@NotNull QuizProgressStatus status,
		Integer chosenChoiceIdx,
		@NotNull LocalDateTime startedAt,
		@NotNull LocalDateTime finishedAt) {
}
