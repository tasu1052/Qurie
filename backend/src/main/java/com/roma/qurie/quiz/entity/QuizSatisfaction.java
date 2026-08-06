package com.roma.qurie.quiz.entity;

import com.roma.qurie.common.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 학생(응시자)별 퀴즈 품질 만족도. 퀴즈셋당 사용자 1건. */
@Getter
@Entity
@Table(
		name = "quiz_satisfaction",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_quiz_satisfaction_set_user",
				columnNames = {"quiz_set_id", "user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizSatisfaction extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "quiz_set_id", nullable = false)
	private Long quizSetId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "rating", nullable = false)
	private int rating;

	@Column(name = "comment", length = 500)
	private String comment;

	public QuizSatisfaction(Long quizSetId, Long userId, int rating, String comment) {
		this.quizSetId = quizSetId;
		this.userId = userId;
		this.rating = rating;
		this.comment = comment;
	}

	public void update(int rating, String comment) {
		this.rating = rating;
		this.comment = comment;
	}
}
