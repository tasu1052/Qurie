package com.roma.qurie.quiz.entity;

import java.time.Duration;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.user.entity.User;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 학생의 문항 응시 기록. 재응시는 앱 로직이 아니라 (quiz_id, user_id) unique 제약으로 막는다 —
 * 동시 요청 두 개가 동시에 존재 여부 검사를 통과해버리는 경우를 앱 로직만으로는 막을 수 없기 때문이다.
 */
@Entity
@Table(
		name = "quiz_progress",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_quiz_progress_quiz_user",
				columnNames = {"quiz_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizProgress extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 10)
	private QuizProgressStatus status;

	/** 고른 보기. SKIPPED/TIMEOUT 이면 null. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chosen_choice_id")
	private QuizChoice chosenChoice;

	/** chosenChoice.isAnswer() 로 계산한다. 응시하지 않았으면 null. */
	@Column(name = "is_correct")
	private Boolean isCorrect;

	@Column(name = "started_at", nullable = false)
	private LocalDateTime startedAt;

	@Column(name = "finished_at", nullable = false)
	private LocalDateTime finishedAt;

	@Column(name = "elapsed_ms", nullable = false)
	private long elapsedMs;

	public QuizProgress(Quiz quiz, User user, QuizProgressStatus status, QuizChoice chosenChoice,
			LocalDateTime startedAt, LocalDateTime finishedAt) {
		if (finishedAt.isBefore(startedAt)) {
			throw new IllegalArgumentException("종료 시각이 시작 시각보다 앞설 수 없습니다.");
		}
		this.quiz = quiz;
		this.user = user;
		this.status = status;
		this.chosenChoice = chosenChoice;
		this.isCorrect = chosenChoice != null ? chosenChoice.isAnswer() : null;
		this.startedAt = startedAt;
		this.finishedAt = finishedAt;
		this.elapsedMs = Duration.between(startedAt, finishedAt).toMillis();
	}
}
