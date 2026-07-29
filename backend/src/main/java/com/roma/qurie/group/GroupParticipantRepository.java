package com.roma.qurie.group;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupParticipantRepository extends JpaRepository<GroupParticipant, Long> {

    /** 구성원 목록은 이름을 함께 보여주므로 user 를 fetch join 한다. */
    @Query("select gp from GroupParticipant gp join fetch gp.user where gp.group.id = :groupId")
    List<GroupParticipant> findAllWithUserByGroupId(@Param("groupId") Long groupId);

    /**
     * 반 전체의 그룹 배정 현황. "정유진 — 현재 그룹 B" 처럼 후보 목록에 현재 소속을 표시하는 데 쓴다.
     * 그룹이 반에 속하므로 group.classId 로 한 번에 긁는다.
     */
    @Query("select gp from GroupParticipant gp join fetch gp.group g join fetch gp.user where g.classId = :classId")
    List<GroupParticipant> findAllWithGroupAndUserByClassId(@Param("classId") Long classId);

    void deleteByGroupId(Long groupId);

    long countByGroupId(Long groupId);
}
