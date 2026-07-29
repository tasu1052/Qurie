package com.roma.qurie.group;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<Group, Long> {

    /** 클래스 삭제 시 그룹이 남아 있으면 막기 위한 검사 */
    boolean existsByClassId(Long classId);
}
