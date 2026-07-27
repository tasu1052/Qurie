package com.roma.qurie.project;

import com.roma.qurie.project.dto.ProjectCreateRequest;
import com.roma.qurie.project.dto.ProjectResponse;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /** 프로젝트 생성 */
    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectCreateRequest request) {
        ProjectResponse response = projectService.create(request);
        return ResponseEntity.created(URI.create("/api/projects/" + response.id())).body(response);
    }
}
