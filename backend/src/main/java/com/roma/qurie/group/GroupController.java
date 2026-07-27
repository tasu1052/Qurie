package com.roma.qurie.group;

import com.roma.qurie.group.dto.GroupCreateRequest;
import com.roma.qurie.group.dto.GroupResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
