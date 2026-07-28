package com.roma.qurie.track;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.enterprise.Enterprise;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 트랙(과정) 엔티티. 기업 하위의 최상위 학습 단위이며 클래스(반)의 부모가 된다.
 * 트랙 이름은 같은 기업 안에서 중복될 수 없다.
 */
@Entity
@Table(
        name = "tracks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_track_enterprise_name",
                columnNames = {"enterprise_id", "name"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Track extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    /**
     * 트랙의 대표 기술(예: JAVA, PYTHON). 트랙 카드의 기술 아이콘과 목록의 {@code ?tech=} 필터에 쓰인다.
     */
    @Column(name = "tech", length = 20)
    private String tech;

    public Track(Enterprise enterprise, String name, String description, String tech) {
        this.enterprise = enterprise;
        this.name = name;
        this.description = description;
        this.tech = tech;
    }
}
