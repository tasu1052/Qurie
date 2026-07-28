package com.roma.qurie.classes;

import com.roma.qurie.common.entity.BaseTimeEntity;
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
 * 반 명단. 매니저와 학생 모두 이 테이블로 소속을 나타낸다 — 매니저를 role 검사로 우회시키면
 * 같은 기업의 모든 반에 들어갈 수 있게 되어 반 단위 격리가 무너진다.
 * 마스터(masters)는 별도 테이블이라 여기에 담기지 않는다. 방 입장은 매니저/학생만 한다.
 *
 * 역할은 ordinary_users.role 에 이미 있어 중복 저장하지 않는다.
 * user 쪽은 연관관계 대신 FK 값(Long)으로 둔다 — 소속 검증에 userId 외에는 필요 없고,
 * classes 패키지가 user 패키지를 참조하지 않게 하기 위함이다(session, group 과 같은 방식).
 */
@Entity
@Table(
		name = "class_users",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_class_user",
				columnNames = {"class_id", "user_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClassUser extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "class_id", nullable = false)
	private ClassEntity classEntity;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	public ClassUser(ClassEntity classEntity, Long userId) {
		this.classEntity = classEntity;
		this.userId = userId;
	}
}
