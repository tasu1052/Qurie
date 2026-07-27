package com.roma.qurie.quiz.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.roma.qurie.common.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "quiz")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quiz extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_set_id", nullable = false)
	private QuizSet quizSet;

	@Enumerated(EnumType.STRING)
	@Column(name = "type", nullable = false, length = 20)
	private QuizType type;

	@Enumerated(EnumType.STRING)
	@Column(name = "purpose", nullable = false, length = 20)
	private QuizPurpose purpose;

	@Enumerated(EnumType.STRING)
	@Column(name = "difficulty", nullable = false, length = 10)
	private QuizDifficulty difficulty;

	@Column(name = "tested_concept", length = 60)
	private String testedConcept;

	@Column(name = "question", nullable = false, columnDefinition = "text")
	private String question;

	@Column(name = "answer_text", columnDefinition = "text")
	private String answerText;

	@Column(name = "explanation", columnDefinition = "text")
	private String explanation;

	@Column(name = "file_path", length = 500)
	private String filePath;

	@Column(name = "line_start")
	private Integer lineStart;

	@Column(name = "line_end")
	private Integer lineEnd;

	@Column(name = "time_limit_sec", nullable = false)
	private int timeLimitSec;

	@Column(name = "order_no", nullable = false)
	private int orderNo;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 10)
	private QuizStatus status;

	@Column(name = "judge_score")
	private Integer judgeScore;

	@Column(name = "reject_reason", columnDefinition = "text")
	private String rejectReason;

	@Column(name = "gen_model", length = 50)
	private String genModel;

	/**
	 * semantic cache 등에 쓰이는 백터 갑
	 * todo: 숫자 백터 근데 행이 너무 커져서 분리 고려
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "embedding")
	private List<Double> embedding;

	/**
	 * todo: QuizChoice 쪽에 둘지, 양방향으로 둘지 고민 필요
	 */
	@OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<QuizChoice> choices = new ArrayList<>();

	@Builder
	private Quiz(QuizType type, QuizPurpose purpose, QuizDifficulty difficulty, String testedConcept, String question,
			String answerText, String explanation, String filePath, Integer lineStart, Integer lineEnd,
			int timeLimitSec, int orderNo, Integer judgeScore, String genModel, List<Double> embedding) {
		this.type = type;
		this.purpose = purpose;
		this.difficulty = difficulty;
		this.testedConcept = testedConcept;
		this.question = question;
		this.answerText = answerText;
		this.explanation = explanation;
		this.filePath = filePath;
		this.lineStart = lineStart;
		this.lineEnd = lineEnd;
		this.timeLimitSec = timeLimitSec;
		this.orderNo = orderNo;
		this.status = QuizStatus.DRAFT;
		this.judgeScore = judgeScore;
		this.genModel = genModel;
		this.embedding = embedding;
	}

	void assignQuizSet(QuizSet quizSet) {
		this.quizSet = quizSet;
	}

	public void addChoice(QuizChoice choice) {
		choices.add(choice);
		choice.assignQuiz(this);
	}
}
