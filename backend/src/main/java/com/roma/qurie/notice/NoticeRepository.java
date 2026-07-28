package com.roma.qurie.notice;

import com.roma.qurie.notice.dto.NoticeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    /*
     * 대상명(트랙명·클래스명)과 작성자명을 한 번에 채운다. track_id / class_id 는 scope 에 따라 하나만 채워지고
     * 작성자는 masters / ordinary_users 로 나뉘어 있어 필요한 쪽만 붙는 left join 네 개로 해결한다.
     * 정렬은 고정 공지를 먼저 올리고 최신순으로 둔다.
     */
    @Query(
            value =
                    """
                    select new com.roma.qurie.notice.dto.NoticeResponse(
                            n.id, n.scope, n.trackId, n.classId,
                            coalesce(track.name, target.name),
                            n.title, n.body, n.pinned,
                            coalesce(master.name, manager.name),
                            n.createdAt)
                    from Notice n
                    left join Track track on track.id = n.trackId
                    left join ClassEntity target on target.id = n.classId
                    left join Master master on master.id = n.createdBy and n.createdByType = :masterType
                    left join User manager on manager.id = n.createdBy and n.createdByType = :managerType
                    where n.enterprise.id = :enterpriseId
                        and (:scope is null or n.scope = :scope)
                        and (:trackId is null or n.trackId = :trackId)
                        and (:classId is null or n.classId = :classId)
                    order by n.pinned desc, n.createdAt desc
                    """,
            countQuery =
                    """
                    select count(n.id)
                    from Notice n
                    where n.enterprise.id = :enterpriseId
                        and (:scope is null or n.scope = :scope)
                        and (:trackId is null or n.trackId = :trackId)
                        and (:classId is null or n.classId = :classId)
                    """)
    Page<NoticeResponse> findNotices(
            @Param("enterpriseId") Long enterpriseId,
            @Param("scope") NoticeScope scope,
            @Param("trackId") Long trackId,
            @Param("classId") Long classId,
            @Param("masterType") NoticeAuthorType masterType,
            @Param("managerType") NoticeAuthorType managerType,
            Pageable pageable);
}
