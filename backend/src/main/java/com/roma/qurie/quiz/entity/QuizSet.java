package com.roma.qurie.quiz.entity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

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

	/** 출제 대상 코드의 버전 식별자. AI 는 이 값을 조회에 쓰지 않고 보관만 한다(§quiz_generation_contract 6.1). */
	@Column(name = "version_hash", nullable = false, length = 64)
	private String versionHash;

	@Enumerated(EnumType.STRING)
	@Column(name = "mode", nullable = false, length = 12)
	private QuizGenerationMode mode;

	@Column(name = "requested_count", nullable = false)
	private int requestedCount;

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

	/** AI 서버가 발급한 quiz_set_id. 상태 조회(GET /api/quiz/{id}/status)에 이 값을 쓴다. */
	@Column(name = "ai_quiz_set_id")
	private Long aiQuizSetId;

	@Column(name = "created_by", nullable = false)
	private Long createdBy;

	/**
	 * 출제 스코프 키. 같은 프로젝트에서 파일/폴더별로 퀴즈셋을 나누고,
	 * 같은 키로 재생성할 때만 기존 셋·응시를 지운다.
	 */
	@Column(name = "source_path", length = 500)
	private String sourcePath;

	/** file | dir — UI 안내·재생성 판정용. */
	@Column(name = "source_kind", length = 12)
	private String sourceKind;

	/** 생성 완료 후 출제자 만족도(1–5). 미응답이면 null. 학생 만족도는 quiz_satisfaction 테이블. */
	@Column(name = "satisfaction_rating")
	private Integer satisfactionRating;

	@Column(name = "satisfaction_comment", length = 500)
	private String satisfactionComment;

	/**
	 * todo: QuizChoice 쪽에 둘지, 양방향으로 둘지 고민 필요
	 */
	@OneToMany(mappedBy = "quizSet", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Quiz> quizzes = new ArrayList<>();

	@Builder
	private QuizSet(Long projectId, String versionHash, QuizGenerationMode mode, int requestedCount,
			int ratioEasy, int ratioNormal, int ratioHard, String userPrompt,
			Long createdBy, String sourcePath, String sourceKind) {
		this.projectId = projectId;
		this.versionHash = versionHash;
		this.mode = mode;
		this.requestedCount = requestedCount;
		this.ratioEasy = ratioEasy;
		this.ratioNormal = ratioNormal;
		this.ratioHard = ratioHard;
		this.userPrompt = userPrompt;
		this.status = QuizSetStatus.QUEUED;
		this.generatedCount = 0;
		this.createdBy = createdBy;
		this.sourcePath = sourcePath;
		this.sourceKind = sourceKind;
	}

	public void addQuiz(Quiz quiz) {
		quizzes.add(quiz);
		quiz.assignQuizSet(this);
	}

	/**
	 * 응시 현황·리포트 분모. COMPLETED 는 generatedCount, 생성 중에는 requestedCount 를
	 * 상한으로 써서 AI overshoot 로 붙은 여분 문항이 집계에 섞이지 않게 한다.
	 */
	public int effectiveQuizCount() {
		int size = quizzes.size();
		if (status == QuizSetStatus.COMPLETED && generatedCount > 0) {
			return Math.min(size, generatedCount);
		}
		if (requestedCount > 0) {
			return Math.min(size, requestedCount);
		}
		return size;
	}

	/**
	 * keep 개를 넘는 여분 문항을 컬렉션에서 제거하고 id 목록을 반환한다.
	 * orphanRemoval 로 DB 에서도 지워지므로, 호출 전에 해당 문항의 quiz_progress 를 먼저 지워야 한다.
	 */
	public List<Long> detachQuizzesBeyond(int keep) {
		if (keep < 0 || quizzes.size() <= keep) {
			return List.of();
		}
		List<Quiz> ordered = quizzes.stream()
				.sorted(Comparator.comparingInt(Quiz::getOrderNo)
						.thenComparing(quiz -> quiz.getId() == null ? Long.MAX_VALUE : quiz.getId()))
				.toList();
		List<Quiz> surplus = ordered.subList(keep, ordered.size());
		List<Long> removedIds = surplus.stream()
				.map(Quiz::getId)
				.filter(Objects::nonNull)
				.toList();
		quizzes.removeAll(surplus);
		return removedIds;
	}

	/**
	 * generatedCount(또는 requestedCount)를 넘는 여분 문항을 컬렉션에서 제거하고 id 목록을 반환한다.
	 * orphanRemoval 로 DB 에서도 지워지므로, 호출 전에 해당 문항의 quiz_progress 를 먼저 지워야 한다.
	 */
	public List<Long> detachSurplusQuizzes() {
		int keep = generatedCount > 0 ? generatedCount : requestedCount;
		return detachQuizzesBeyond(keep);
	}

	/** 집계·응답용 — 여분(overshoot)을 제외한 문항 목록. 컬렉션은 바꾸지 않는다. */
	public List<Quiz> effectiveQuizzes() {
		int keep = effectiveQuizCount();
		if (keep >= quizzes.size()) {
			return List.copyOf(quizzes);
		}
		return quizzes.stream()
				.sorted(Comparator.comparingInt(Quiz::getOrderNo)
						.thenComparing(quiz -> quiz.getId() == null ? Long.MAX_VALUE : quiz.getId()))
				.limit(keep)
				.toList();
	}

	/** AI 서버가 생성 요청을 접수하면 발급받은 id 를 기록하고 생성 중 상태로 넘어간다. */
	public void markGenerating(Long aiQuizSetId) {
		this.aiQuizSetId = aiQuizSetId;
		this.status = QuizSetStatus.GENERATING;
	}

	/** 생성 중 부분 반영. 상태는 GENERATING 유지. */
	public void updateProgress(int generatedCount) {
		this.generatedCount = generatedCount;
	}

	public void complete(int generatedCount) {
		this.generatedCount = generatedCount;
		this.status = QuizSetStatus.COMPLETED;
	}

	public void fail(String errorMessage) {
		this.errorMessage = errorMessage;
		this.status = QuizSetStatus.FAILED;
	}

	public void submitSatisfaction(int rating, String comment) {
		this.satisfactionRating = rating;
		this.satisfactionComment = comment;
	}
}
