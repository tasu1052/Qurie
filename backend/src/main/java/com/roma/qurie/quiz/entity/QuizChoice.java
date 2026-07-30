package com.roma.qurie.quiz.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "quiz_choice")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizChoice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	private Quiz quiz;

	@Column(name = "idx", nullable = false)
	private int idx;

	@Column(name = "content", nullable = false, columnDefinition = "text")
	private String content;

	@Column(name = "is_answer", nullable = false)
	private boolean isAnswer;

	private QuizChoice(int idx, String content, boolean isAnswer) {
		this.idx = idx;
		this.content = content;
		this.isAnswer = isAnswer;
	}

	public static QuizChoice of(int idx, String content, boolean isAnswer) {
		return new QuizChoice(idx, content, isAnswer);
	}

	void assignQuiz(Quiz quiz) {
		this.quiz = quiz;
	}
}
