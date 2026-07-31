package com.roma.qurie.notice;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.enterprise.Enterprise;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공지사항 엔티티. 기업 전체 / 트랙 / 클래스 단위로 발송하며 개인 발송은 지원하지 않는다.
 *
 * track_id 와 class_id 는 scope 에 따라 하나만 채워지는 대상 포인터라 연관관계가 아니라 FK 값(Long)으로 둔다.
 * 반대로 enterprise 는 모든 공지가 반드시 속하는 소유자이므로 연관관계로 잡는다.
 */
@Entity
@Table(
        name = "notices",
        indexes = @Index(
                name = "idx_notice_enterprise_created",
                columnList = "enterprise_id, created_at")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 12)
    private NoticeScope scope;

    @Column(name = "track_id")
    private Long trackId;

    @Column(name = "class_id")
    private Long classId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    /**
     * 목록 상단 고정 여부. 공지사항 화면의 "고정됨" 탭과 작성 모달의 "상단 고정" 토글에 쓰인다.
     */
    @Column(name = "is_pinned", nullable = false)
    private boolean pinned;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "created_by_type", nullable = false, length = 12)
    private NoticeAuthorType createdByType;

    @Builder
    public Notice(
            Enterprise enterprise,
            NoticeScope scope,
            Long trackId,
            Long classId,
            String title,
            String body,
            boolean pinned,
            Long createdBy,
            NoticeAuthorType createdByType) {
        verifyTarget(scope, trackId, classId);
        this.enterprise = enterprise;
        this.scope = scope;
        this.trackId = trackId;
        this.classId = classId;
        this.title = title;
        this.body = body;
        this.pinned = pinned;
        this.createdBy = createdBy;
        this.createdByType = createdByType;
    }

    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeBody(String body) {
        this.body = body;
    }

    public void changePinned(boolean pinned) {
        this.pinned = pinned;
    }

    /* scope 와 대상 id 가 어긋난 공지는 어느 화면에도 노출되지 않으므로 생성 시점에 막는다. */
    private void verifyTarget(NoticeScope scope, Long trackId, Long classId) {
        boolean valid = switch (scope) {
            case ENTERPRISE -> trackId == null && classId == null;
            case TRACK -> trackId != null && classId == null;
            case CLASS -> classId != null && trackId == null;
        };
        if (!valid) {
            throw new IllegalArgumentException("공지 발송 대상이 scope 와 맞지 않습니다: " + scope);
        }
    }
}
