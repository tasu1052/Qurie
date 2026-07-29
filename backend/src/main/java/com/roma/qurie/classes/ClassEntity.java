package com.roma.qurie.classes;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.track.Track;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 클래스(반) 엔티티. 트랙 하위의 운영 단위이며 세션·그룹의 부모가 된다.
 * 반 번호는 전역이 아니라 같은 트랙 안에서만 고유하다.
 *
 * 이름을 Class로 두면 java.lang.Class와 충돌하고 패키지명 class는 Java 키워드라 쓸 수 없어
 * 엔티티는 ClassEntity, 패키지는 classes로 둔다. 테이블명 classes는 예약어 class를 피한 것이다.
 */
@Entity
@Table(
        name = "classes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_class_track_number",
                columnNames = {"track_id", "class_number"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClassEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @Column(name = "class_number", nullable = false)
    private int classNumber;

    /**
     * 화면에 노출되는 반 이름(예: 서울 1반). class_number만으로는 지역 표기를 할 수 없어 별도로 둔다.
     */
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /**
     * 정원. 현재 인원은 class_user 집계로 구하고 이 값은 상한만 나타낸다.
     */
    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Builder
    public ClassEntity(
            Track track,
            int classNumber,
            String name,
            Integer capacity,
            String description,
            LocalDateTime startedAt,
            LocalDateTime endedAt) {
        this.track = track;
        this.classNumber = classNumber;
        this.name = name;
        this.capacity = capacity;
        this.description = description;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }

    public void changeClassNumber(int classNumber) {
        this.classNumber = classNumber;
    }

    public void rename(String name) {
        this.name = name;
    }

    public void changeCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    /* 시작·종료는 앞뒤가 맞아야 하므로 반드시 함께 바꾼다. */
    public void changePeriod(LocalDateTime startedAt, LocalDateTime endedAt) {
        if (startedAt != null && endedAt != null && endedAt.isBefore(startedAt)) {
            throw new IllegalArgumentException("종료일이 시작일보다 앞설 수 없습니다.");
        }
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }
}
