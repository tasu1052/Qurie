package com.roma.qurie.group;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 그룹 엔티티. 특정 반(class) 안에서 학생들을 묶는 단위이다.
 * class_id 는 아직 엔티티가 없어 FK 값(Long) 으로만 보관한다.
 */
@Entity
@Table(name = "study_groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Group(
        Long classId,
        String name,
        String description,
        LocalDateTime startedAt,
        LocalDateTime endedAt
    ) {
        this.classId = classId;
        this.name = name;
        this.description = description;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }

    /* PUT(전체 교체) 계약이라 네 필드를 한 번에 바꾼다. 소속 반(classId)은 바꿀 수 없다. */
    public void update(String name, String description, LocalDateTime startedAt, LocalDateTime endedAt) {
        if (endedAt.isBefore(startedAt)) {
            throw new IllegalArgumentException("종료일이 시작일보다 앞설 수 없습니다.");
        }
        this.name = name;
        this.description = description;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }
}
