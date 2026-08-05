package com.roma.qurie.project;

import com.roma.qurie.project.dto.ProjectCreateRequest;
import com.roma.qurie.project.dto.ProjectFileContentResponse;
import com.roma.qurie.project.dto.ProjectFileSummaryResponse;
import com.roma.qurie.project.dto.ProjectFileUpdateRequest;
import com.roma.qurie.project.dto.ProjectImportGitRequest;
import com.roma.qurie.project.dto.ProjectImportLocalRequest;
import com.roma.qurie.project.dto.ProjectImportResponse;
import com.roma.qurie.project.dto.ProjectResponse;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    /** 로컬 폴더 임포트. 프론트가 읽은 {경로: 내용} 파일 묶음을 받아 저장한다 (세션 구성원) */
    @PostMapping("/import/local")
    public ResponseEntity<ProjectImportResponse> importLocal(
            @AuthenticationPrincipal AuthUser requester,
            @Valid @RequestBody ProjectImportLocalRequest request) {
        ProjectImportResponse response = projectService.importLocal(requester, request);
        return ResponseEntity.created(URI.create("/api/projects/" + response.projectId())).body(response);
    }

    /** Git 저장소 임포트. https 저장소만 지원하고, 비공개 저장소는 요청의 pat 로 인증한다 (그룹 리더 / 반 공개는 강사) */
    @PostMapping("/import/git")
    public ResponseEntity<ProjectImportResponse> importGit(
            @AuthenticationPrincipal AuthUser requester,
            @Valid @RequestBody ProjectImportGitRequest request) {
        ProjectImportResponse response = projectService.importGit(requester, request);
        return ResponseEntity.created(URI.create("/api/projects/" + response.projectId())).body(response);
    }

    /** 세션의 현재 프로젝트(가장 최근 임포트). 없으면 404 — 참가자 전원이 이 값으로 같은 프로젝트를 연다 */
    @GetMapping("/current")
    public ProjectResponse current(
            @AuthenticationPrincipal AuthUser requester, @RequestParam("sessionId") Long sessionId) {
        return projectService.getCurrentProject(requester, sessionId);
    }

    /** 파일 목록(경로·크기). 세션 편집기의 파일 트리가 이 경로 문자열로 트리를 구성한다 */
    @GetMapping("/{projectId}/files")
    public List<ProjectFileSummaryResponse> files(
            @AuthenticationPrincipal AuthUser requester, @PathVariable("projectId") Long projectId) {
        return projectService.getFiles(requester, projectId);
    }

    /** 파일 내용. 경로에 / 가 들어가므로 path variable 이 아니라 쿼리 파라미터로 받는다 */
    @GetMapping("/{projectId}/files/content")
    public ProjectFileContentResponse fileContent(
            @AuthenticationPrincipal AuthUser requester,
            @PathVariable("projectId") Long projectId,
            @RequestParam("path") String path) {
        return projectService.getFileContent(requester, projectId, path);
    }

    /** 파일 내용 저장. 세션 편집기의 편집본을 스냅샷에 반영한다 (세션 구성원). 갱신된 versionHash 를 돌려준다 */
    @PutMapping("/{projectId}/files/content")
    public ProjectResponse updateFileContent(
            @AuthenticationPrincipal AuthUser requester,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody ProjectFileUpdateRequest request) {
        return projectService.updateFileContent(requester, projectId, request);
    }
}
