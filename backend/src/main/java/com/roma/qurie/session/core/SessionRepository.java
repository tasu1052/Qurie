package com.roma.qurie.session.core;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, Long> {

    /** 특정 클래스의 열린/닫힌 세션 조회. 목록은 열린 세션(active=true)만 사용한다. */
    List<Session> findByClassIdAndActive(Long classId, boolean active);

    /** 클래스 삭제 시 세션 기록이 남아 있으면 막기 위한 검사 */
    boolean existsByClassId(Long classId);
}