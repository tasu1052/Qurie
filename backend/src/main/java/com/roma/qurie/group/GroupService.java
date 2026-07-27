package com.roma.qurie.group;

import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;

    /* 그룹을 생성하는 함수 */
    @Transactional
    public GroupResponse create(GroupCreateRequest request) {
        Group group =
                Group.builder()
                        .classId(request.classId())
                        .name(request.name())
                        .description(request.description())
                        .startedAt(request.startedAt())
                        .endedAt(request.endedAt())
                        .build();
        return GroupResponse.from(groupRepository.save(group));
    }
}
