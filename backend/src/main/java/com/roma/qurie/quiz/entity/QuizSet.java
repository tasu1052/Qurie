package com.roma.qurie.quiz.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "quiz_set")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizSet extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "project_id", nullable = false)
	private Long projectId;

	@Column(name = "snapshot_id")
	private Long snapshotId;

	@Enumerated(EnumType.STRING)
	@Column(name = "mode", nullable = false, length = 12)
	private QuizGenerationMode mode;

	@Column(name = "requested_count", nullable = false)
	private int requestedCount;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "requested_types", nullable = false)
	private List<QuizType> requestedTypes = new ArrayList<>();

	@Column(name = "ratio_easy", nullable = false)
	private int ratioEasy;

	@Column(name = "ratio_normal", nullable = false)
	private int ratioNormal;

	@Column(name = "ratio_hard", nullable = false)
	private int ratioHard;

	@Column(name = "user_prompt", columnDefinition = "text")
	private String userPrompt;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 12)
	private QuizSetStatus status;

	@Column(name = "generated_count", nullable = false)
	private int generatedCount;

	@Column(name = "error_message", columnDefinition = "text")
	private String errorMessage;

	@Column(name = "created_by", nullable = false)
	private Long createdBy;

	/**
	 * todo: QuizChoice 쪽에 둘지, 양방향으로 둘지 고민 필요
	 */
	@OneToMany(mappedBy = "quizSet", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Quiz> quizzes = new ArrayList<>();

	@Builder
	private QuizSet(Long projectId, Long snapshotId, QuizGenerationMode mode, int requestedCount,
			List<QuizType> requestedTypes, int ratioEasy, int ratioNormal, int ratioHard, String userPrompt,
			Long createdBy) {
		this.projectId = projectId;
		this.snapshotId = snapshotId;
		this.mode = mode;
		this.requestedCount = requestedCount;
		this.requestedTypes = requestedTypes == null ? new ArrayList<>() : new ArrayList<>(requestedTypes);
		this.ratioEasy = ratioEasy;
		this.ratioNormal = ratioNormal;
		this.ratioHard = ratioHard;
		this.userPrompt = userPrompt;
		this.status = QuizSetStatus.QUEUED;
		this.generatedCount = 0;
		this.createdBy = createdBy;
	}

	public void addQuiz(Quiz quiz) {
		quizzes.add(quiz);
		quiz.assignQuizSet(this);
	}
}
