package com.roma.qurie.report.entity;

import com.roma.qurie.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Entity
@Table(
        name = "session_reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_session_report_session_user",
                columnNames = {"session_id", "ordinary_user_id"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionReport extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "ordinary_user_id", nullable = false)
    private Long ordinaryUserId;

    @Column(name = "quiz_set_id")
    private Long quizSetId;

    @Column(name = "quiz_total_count", nullable = false)
    private int quizTotalCount;

    @Column(name = "quiz_attempted_count", nullable = false)
    private int quizAttemptedCount;

    @Column(name = "quiz_correct_count", nullable = false)
    private int quizCorrectCount;

    @Column(name = "quiz_skipped_count", nullable = false)
    private int quizSkippedCount;

    @Column(name = "completion_rate", precision = 5, scale = 2)
    private BigDecimal completionRate;

    @Column(name = "accuracy", precision = 5, scale = 2)
    private BigDecimal accuracy;

    @Column(name = "avg_elapsed_ms")
    private Integer avgElapsedMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "difficulty_ratio")
    private Map<String, Object> difficultyRatio;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "concept_stats")
    private Map<String, Object> conceptStats;

    @Column(name = "quiz_rating", precision = 3, scale = 1)
    private BigDecimal quizRating;

    @Column(name = "ai_comment", columnDefinition = "text")
    private String aiComment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_strengths")
    private List<String> aiStrengths;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_improvements")
    private List<String> aiImprovements;

    @Column(name = "manager_comment", length = 2048)
    private String managerComment;

    @Column(name = "manager_comment_by")
    private Long managerCommentBy;

    @Column(name = "manager_comment_at")
    private LocalDateTime managerCommentAt;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Builder
    private SessionReport(Long sessionId, Long ordinaryUserId, Long quizSetId, int quizTotalCount,
                          int quizAttemptedCount, int quizCorrectCount, int quizSkippedCount, BigDecimal completionRate,
                          BigDecimal accuracy, Integer avgElapsedMs, Map<String, Object> difficultyRatio,
                          Map<String, Object> conceptStats, BigDecimal quizRating, String aiComment, List<String> aiStrengths,
                          List<String> aiImprovements, LocalDateTime issuedAt) {
        this.sessionId = sessionId;
        this.ordinaryUserId = ordinaryUserId;
        this.quizSetId = quizSetId;
        this.quizTotalCount = quizTotalCount;
        this.quizAttemptedCount = quizAttemptedCount;
        this.quizCorrectCount = quizCorrectCount;
        this.quizSkippedCount = quizSkippedCount;
        this.completionRate = completionRate;
        this.accuracy = accuracy;
        this.avgElapsedMs = avgElapsedMs;
        this.difficultyRatio = difficultyRatio;
        this.conceptStats = conceptStats;
        this.quizRating = quizRating;
        this.aiComment = aiComment;
        this.aiStrengths = aiStrengths;
        this.aiImprovements = aiImprovements;
        this.issuedAt = issuedAt;
    }
}
