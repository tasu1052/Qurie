package com.roma.qurie.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.roma.qurie.common.entity.BaseTimeEntity;

/**
 * 부트캠프에 소속된 매니저/학생 계정 엔티티. 마스터(masters)와 달리 회원가입 API로 등록된다.
 * enterprise 패키지에 조회용 리포지토리가 없어, report 도메인과 같이 소속 기업을 연관관계가 아닌 FK 값(Long)으로 보관한다.
 */
@Entity
@Table(name = "ordinary_users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "enterprise_id", nullable = false)
	private Long enterpriseId;

	@Column(name = "email", nullable = false, unique = true, length = 255)
	private String email;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private UserRole role;

	/**
	 * 평문이 아니라 인코딩된 값만 저장한다. 인코딩은 서비스 계층에서 수행한다.
	 */
	@Column(name = "password", nullable = false, length = 255)
	private String password;

	@Column(name = "name", nullable = false, length = 50)
	private String name;

	/*
	 * phone/region/gender 는 마이페이지에서 선택 입력하는 부가 정보라 가입 시점에는 비어 있고, 항상 null 을 허용한다.
	 * gender 는 화면 select 값(MALE/FEMALE)을 그대로 저장하되 형식이 늘어날 수 있어 enum 대신 문자열로 둔다.
	 */
	@Column(name = "phone", length = 30)
	private String phone;

	@Column(name = "region", length = 50)
	private String region;

	@Column(name = "gender", length = 10)
	private String gender;

	@Builder
	private User(Long enterpriseId, String email, UserRole role, String password, String name) {
		this.enterpriseId = enterpriseId;
		this.email = email;
		this.role = role;
		this.password = password;
		this.name = name;
	}

	public void updateName(String name) {
		this.name = name;
	}

	public void updatePhone(String phone) {
		this.phone = phone;
	}

	public void updateRegion(String region) {
		this.region = region;
	}

	public void updateGender(String gender) {
		this.gender = gender;
	}

	/**
	 * @param encodedPassword: 서비스 계층에서 인코딩을 끝낸 값
	 */
	public void changePassword(String encodedPassword) {
		this.password = encodedPassword;
	}
}
