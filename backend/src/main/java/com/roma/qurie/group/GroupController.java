package com.roma.qurie.group;

import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupDetailResponse;
import com.roma.qurie.group.dto.GroupDuplicateRequest;
import com.roma.qurie.group.dto.GroupEditRequest;
import com.roma.qurie.group.dto.GroupMemberCandidateResponse;
import com.roma.qurie.group.dto.GroupResponse;
import com.roma.qurie.group.dto.GroupShuffleRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
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

    /**
     * 배정 후보 목록. 리터럴 경로를 `/{groupId}` 보다 앞에 둔다 —
     * 뒤에 두면 groupId="candidates" 로 매칭되어 Long 변환 실패(400)가 난다.
     */
    @GetMapping("/candidates")
    public List<GroupMemberCandidateResponse> candidates(
            @AuthenticationPrincipal AuthUser authUser, @RequestParam("classId") Long classId) {
        return groupService.getMemberCandidates(authUser, classId);
    }

    /**
     * 랜덤 배정(셔플). 리터럴 경로를 path variable 보다 앞에 둔다.
     */
    @PostMapping("/shuffle")
    public List<GroupDetailResponse> shuffle(@AuthenticationPrincipal AuthUser authUser,
            @RequestParam("classId") Long classId, @Valid @RequestBody GroupShuffleRequest request) {
        return groupService.shuffle(authUser, classId, request);
    }

    /** 그룹 상세 조회 (MASTER, 소속 MANAGER·STUDENT) */
    @GetMapping("/{groupId}")
    public GroupResponse get(@AuthenticationPrincipal AuthUser authUser, @PathVariable("groupId") Long groupId) {
        return groupService.getGroup(authUser, groupId);
    }

    /** 그룹 상세 + 구성원 조회 (MASTER, 소속 MANAGER·STUDENT). 편집 화면의 초기 데이터 */
    @GetMapping("/{groupId}/detail")
    public GroupDetailResponse detail(
            @AuthenticationPrincipal AuthUser authUser, @PathVariable("groupId") Long groupId) {
        return groupService.getGroupDetail(authUser, groupId);
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

    /** 그룹 편집 — 제목·설명·운영 기간·구성원을 한 번에 저장 (MASTER, 담당 MANAGER) */
    @PatchMapping("/{groupId}")
    public GroupDetailResponse edit(@AuthenticationPrincipal AuthUser authUser,
            @PathVariable("groupId") Long groupId, @Valid @RequestBody GroupEditRequest request) {
        return groupService.edit(authUser, groupId, request);
    }

    /** 그룹 복제 — 레이아웃(이름·설명·기간)을 그대로 가진 새 그룹 생성 (MASTER, 담당 MANAGER) */
    @PostMapping("/{groupId}/duplicate")
    public ResponseEntity<GroupDetailResponse> duplicate(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("groupId") Long groupId,
            @Valid @RequestBody(required = false) GroupDuplicateRequest request) {
        GroupDuplicateRequest body = request != null ? request : new GroupDuplicateRequest(null, null);
        GroupDetailResponse response = groupService.duplicate(authUser, groupId, body);
        return ResponseEntity.created(URI.create("/api/groups/" + response.id())).body(response);
    }
}
