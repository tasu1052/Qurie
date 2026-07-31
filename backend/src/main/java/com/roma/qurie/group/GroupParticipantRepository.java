package com.roma.qurie.group;

import com.roma.qurie.user.entity.UserRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupParticipantRepository extends JpaRepository<GroupParticipant, Long> {

    /**
     * 구성원 목록은 이름을 함께 보여주므로 user 를 fetch join 한다.
     * 그룹 구성원은 학생뿐이어야 하므로 역할로 한 번 더 거른다 — 필터가 없던 시기에 배정된
     * 매니저 행이 남아 있어도 상세·편집 응답에 노출되지 않는다.
     */
    @Query("""
            select gp from GroupParticipant gp join fetch gp.user u
            where gp.group.id = :groupId and u.role = :role
            """)
    List<GroupParticipant> findAllWithUserByGroupIdAndRole(
            @Param("groupId") Long groupId, @Param("role") UserRole role);

    /**
     * 반 전체의 그룹 배정 현황. "정유진 — 현재 그룹 B" 처럼 후보 목록에 현재 소속을 표시하는 데 쓴다.
     * 그룹이 반에 속하므로 group.classId 로 한 번에 긁는다.
     */
    @Query("select gp from GroupParticipant gp join fetch gp.group g join fetch gp.user where g.classId = :classId")
    List<GroupParticipant> findAllWithGroupAndUserByClassId(@Param("classId") Long classId);

    /** 반 안에서 이 사용자가 속한 그룹 id 들. 학생에게 보여줄 그룹 세션을 걸러낼 때 쓴다. */
    @Query("select gp.group.id from GroupParticipant gp where gp.group.classId = :classId and gp.user.id = :userId")
    List<Long> findGroupIdsByClassIdAndUserId(@Param("classId") Long classId, @Param("userId") Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    /** 그룹 리더 판정. 세션 안에서 프로젝트를 임포트할 수 있는 사람이 리더뿐이라 필요하다. */
    boolean existsByGroupIdAndUserIdAndRole(Long groupId, Long userId, GroupParticipantRole role);

    void deleteByGroupId(Long groupId);

    long countByGroupId(Long groupId);
}
