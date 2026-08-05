package com.roma.qurie.session.core;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, Long> {

    /** 특정 클래스의 열린/닫힌 세션 조회. 목록은 열린 세션(active=true)만 사용한다. */
    List<Session> findByClassIdAndActive(Long classId, boolean active);

    /** 종료된 세션까지 포함한 클래스 전체 세션 조회. 지난 세션 열람용이라 최신 세션이 먼저 오도록 정렬한다. */
    List<Session> findByClassIdOrderByIdDesc(Long classId);

    /** 클래스 삭제 시 세션 기록이 남아 있으면 막기 위한 검사 */
    boolean existsByClassId(Long classId);

    /** 반 공개 세션은 열려 있는 것 하나만 허용한다. 생성 전에 이미 열린 공개 세션이 있는지 확인한다. */
    boolean existsByClassIdAndClassPublicTrueAndActiveTrue(Long classId);

    long countByClassId(Long classId);

    long countByClassIdAndActive(Long classId, boolean active);
}