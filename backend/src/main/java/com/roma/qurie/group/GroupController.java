package com.roma.qurie.group;

import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupResponse;
import com.roma.qurie.group.dto.GroupUpdateRequest;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /** 그룹 생성 */
    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupCreateRequest request) {
        GroupResponse response = groupService.create(request);
        return ResponseEntity.created(URI.create("/api/groups/" + response.id())).body(response);
    }

    /** 반의 그룹 목록 조회 (MASTER, 소속 MANAGER·STUDENT) */
    @GetMapping
    public List<GroupResponse> list(
            @AuthenticationPrincipal AuthUser authUser, @RequestParam("classId") Long classId) {
        return groupService.getGroups(authUser, classId);
    }

    /** 그룹 상세 조회 (MASTER, 소속 MANAGER·STUDENT) */
    @GetMapping("/{groupId}")
    public GroupResponse get(@AuthenticationPrincipal AuthUser authUser, @PathVariable("groupId") Long groupId) {
        return groupService.getGroup(authUser, groupId);
    }

    /** 그룹 수정 (MASTER, 담당 MANAGER) — PUT 전체 교체 */
    @PutMapping("/{groupId}")
    public GroupResponse update(@AuthenticationPrincipal AuthUser authUser,
            @PathVariable("groupId") Long groupId, @Valid @RequestBody GroupUpdateRequest request) {
        return groupService.update(authUser, groupId, request);
    }

    /** 그룹 삭제 (MASTER, 담당 MANAGER) */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthUser authUser, @PathVariable("groupId") Long groupId) {
        groupService.delete(authUser, groupId);
        return ResponseEntity.noContent().build();
    }
}
