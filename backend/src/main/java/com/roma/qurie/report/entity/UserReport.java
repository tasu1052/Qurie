package com.roma.qurie.report.entity;

import com.roma.qurie.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "user_reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_report_user_class",
                columnNames = {"ordinary_user_id", "class_id"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserReport extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ordinary_user_id", nullable = false)
    private Long ordinaryUserId;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "session_count", nullable = false)
    private int sessionCount;

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

    @Column(name = "rating", precision = 3, scale = 1)
    private BigDecimal rating;

    /**
     * 평점 공식이 확정되지 않아(Planning OPEN-01) 어떤 버전으로 산출한 값인지 함께 남긴다.
     */
    @Column(name = "rating_formula_version", length = 20)
    private String ratingFormulaVersion;

    @Column(name = "ai_comment", columnDefinition = "text")
    private String aiComment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_strengths")
    private List<String> aiStrengths;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_improvements")
    private List<String> aiImprovements;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Builder
    private UserReport(Long ordinaryUserId, Long classId, int sessionCount, int quizTotalCount,
                       int quizAttemptedCount, int quizCorrectCount, int quizSkippedCount,
                       BigDecimal completionRate, BigDecimal accuracy, Integer avgElapsedMs,
                       Map<String, Object> difficultyRatio, Map<String, Object> conceptStats,
                       BigDecimal rating, String ratingFormulaVersion, String aiComment,
                       List<String> aiStrengths, List<String> aiImprovements, LocalDateTime issuedAt) {
        this.ordinaryUserId = ordinaryUserId;
        this.classId = classId;
        this.sessionCount = sessionCount;
        this.quizTotalCount = quizTotalCount;
        this.quizAttemptedCount = quizAttemptedCount;
        this.quizCorrectCount = quizCorrectCount;
        this.quizSkippedCount = quizSkippedCount;
        this.completionRate = completionRate;
        this.accuracy = accuracy;
        this.avgElapsedMs = avgElapsedMs;
        this.difficultyRatio = difficultyRatio;
        this.conceptStats = conceptStats;
        this.rating = rating;
        this.ratingFormulaVersion = ratingFormulaVersion;
        this.aiComment = aiComment;
        this.aiStrengths = aiStrengths;
        this.aiImprovements = aiImprovements;
        this.issuedAt = issuedAt;
    }
}
