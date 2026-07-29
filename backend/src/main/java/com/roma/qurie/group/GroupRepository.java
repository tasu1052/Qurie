package com.roma.qurie.group;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<Group, Long> {

    /** 클래스 삭제 시 그룹이 남아 있으면 막기 위한 검사 */
    boolean existsByClassId(Long classId);

    /** 반의 그룹 목록. 화면이 그룹 A·B·C 순으로 보여주므로 이름순으로 고정한다. */
    List<Group> findAllByClassIdOrderByNameAsc(Long classId);
}
