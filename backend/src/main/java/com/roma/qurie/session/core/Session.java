package com.roma.qurie.session.core;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 방(세션) 엔티티. 사용자가 방을 생성하면 열린 세션 목록에서 다른 사람들이 참여할 수 있다.
 * slug 는 방 제목이다. class_id, created_by 는 아직 엔티티가 없어 FK 값(Long) 으로만 보관한다.
 */
@Entity
@Table(name = "sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    /** 방 제목 */
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Session(
        Long classId,
        String title,
        Long createdBy
    ) {
        this.classId = classId;
        this.title = title;
        this.createdBy = createdBy;
        this.active = true;
    }

    /** 방 제목을 변경한다. */
    public void changeTitle(String title) {
        this.title = title;
    }

    /** 방을 닫는다(소멸). 한 번 닫히면 다시 열 수 없다. */
    public void close() {
        if (!this.active) {
            throw new IllegalStateException("이미 닫힌(소멸된) 세션입니다.");
        }
        this.active = false;
        this.endedAt = LocalDateTime.now();
    }
}
