package com.roma.qurie.master;

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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 부트캠프 담당자(마스터) 엔티티. 매니저/학생(ordinary_user)과 달리 별도 테이블로 관리하며,
 * 마스터 계정은 회원가입 API 없이 운영팀이 DB에 직접 등록한다.
 */
@Entity
@Table(name = "masters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Master extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /*
     * 마이페이지 화면을 매니저/학생(ordinary_users)과 공유하므로 부가 정보 컬럼도 같은 이름·크기로 맞춘다.
     * 선택 입력 값이라 항상 null 을 허용한다.
     */
    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "gender", length = 10)
    private String gender;

    public Master(Enterprise enterprise, String email, String password, String name) {
        this.enterprise = enterprise;
        this.email = email;
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
