package com.roma.qurie.group;

import com.roma.qurie.common.entity.BaseTimeEntity;
import com.roma.qurie.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * 그룹 구성원. 같은 그룹에 같은 사람이 두 번 들어가지 않도록 (group_id, user_id) 를 유니크로 둔다.
 *
 * 구성원 목록 화면이 이름을 함께 보여주므로 user 는 연관관계로 잡는다(ClassUser 와 같은 방식).
 */
@Entity
@Table(
        name = "group_participants",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_group_participant",
                columnNames = {"group_id", "user_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GroupParticipant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private GroupParticipantRole role;

    public GroupParticipant(Group group, User user, GroupParticipantRole role) {
        this.group = group;
        this.user = user;
        this.role = role;
    }

    public void changeRole(GroupParticipantRole role) {
        this.role = role;
    }

    public boolean isLeader() {
        return role == GroupParticipantRole.LEADER;
    }
}
