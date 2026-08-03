package com.roma.qurie.project;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.ImportedFileSanitizer.SkippedFile;
import com.roma.qurie.project.dto.ProjectCreateRequest;
import com.roma.qurie.project.dto.ProjectFileContentResponse;
import com.roma.qurie.project.dto.ProjectFileSummaryResponse;
import com.roma.qurie.project.dto.ProjectImportGitRequest;
import com.roma.qurie.project.dto.ProjectImportLocalRequest;
import com.roma.qurie.project.dto.ProjectImportNotification;
import com.roma.qurie.project.dto.ProjectImportResponse;
import com.roma.qurie.project.dto.ProjectResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final SessionParticipantService participantService;
    private final GitProjectReader gitProjectReader;
    private final TransactionTemplate transactionTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    /* 프로젝트를 생성하는 함수 */
    @Transactional
    public ProjectResponse create(ProjectCreateRequest request) {
        Project project = new Project(request.sessionId(), request.path(), request.importedBy());
        return ProjectResponse.from(projectRepository.save(project));
    }

    /**
     * 로컬 폴더 임포트. 프론트가 폴더 선택으로 읽어 보낸 {경로: 내용}을 검증해 프로젝트와 파일로 저장한다.
     * 임포트는 그룹 전체의 작업 대상을 고정하므로 그룹 리더(반 공개 세션은 강사)만 할 수 있다.
     */
    public ProjectImportResponse importLocal(AuthUser requester, ProjectImportLocalRequest request) {
        participantService.verifyCanImportProject(request.sessionId(), requester);

        ImportedFileSanitizer.Result sanitized = ImportedFileSanitizer.sanitize(request.files());

        return store(request.sessionId(), null, requester.id(), sanitized.files(), sanitized.skipped());
    }

    /**
     * Git 저장소 임포트. clone(최대 30초)이 끼므로 저장만 트랜잭션으로 묶는다 —
     * 메서드 전체에 @Transactional 을 걸면 clone 하는 동안 DB 커넥션을 점유한다.
     */
    public ProjectImportResponse importGit(AuthUser requester, ProjectImportGitRequest request) {
        participantService.verifyCanImportProject(request.sessionId(), requester);

        GitProjectReader.ReadResult read =
                gitProjectReader.readFiles(request.repoUrl(), request.branch(), request.subPath(), request.pat());
        ImportedFileSanitizer.Result sanitized = ImportedFileSanitizer.sanitize(read.files());

        List<SkippedFile> skipped = new ArrayList<>(read.skipped());
        skipped.addAll(sanitized.skipped());

        return store(request.sessionId(), request.repoUrl(), requester.id(), sanitized.files(), skipped);
    }

    /**
     * 세션의 현재 프로젝트(가장 최근 임포트) 조회. 모든 참가자가 같은 프로젝트를 보게 하는 기준점이다 —
     * 프론트가 localStorage 로 각자 들고 있으면 임포트한 사람 외에는 프로젝트를 찾을 수 없다.
     */
    @Transactional(readOnly = true)
    public ProjectResponse getCurrentProject(AuthUser requester, Long sessionId) {
        participantService.verifyCanEnter(sessionId, requester);

        return projectRepository.findFirstBySessionIdOrderByIdDesc(sessionId)
                .map(ProjectResponse::from)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "세션에 임포트된 프로젝트가 없습니다."));
    }

    /** 파일 트리용 목록. 경로 오름차순, 내용은 포함하지 않는다. */
    @Transactional(readOnly = true)
    public List<ProjectFileSummaryResponse> getFiles(AuthUser requester, Long projectId) {
        Project project = findProject(projectId);
        participantService.verifyCanEnter(project.getSessionId(), requester);

        return projectFileRepository.findSummariesByProjectId(projectId);
    }

    /** 파일 내용 조회. 편집기에서 파일을 열 때 사용한다. */
    @Transactional(readOnly = true)
    public ProjectFileContentResponse getFileContent(AuthUser requester, Long projectId, String path) {
        Project project = findProject(projectId);
        participantService.verifyCanEnter(project.getSessionId(), requester);

        return projectFileRepository.findByProjectIdAndPath(projectId, path)
                .map(ProjectFileContentResponse::from)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "프로젝트에 해당 파일이 없습니다: " + path));
    }

    /** 프로젝트와 파일 저장을 한 트랜잭션으로 묶는다. 파일 저장이 실패하면 프로젝트 행도 남지 않는다. */
    private ProjectImportResponse store(Long sessionId, String sourcePath, Long importedBy,
            Map<String, String> files, List<SkippedFile> skipped) {
        String versionHash = versionHashOf(files);
        int fileCount = files.size();

        Project saved = transactionTemplate.execute(status -> {
            Project project = projectRepository.save(
                    new Project(sessionId, sourcePath, importedBy, versionHash, fileCount));
            List<ProjectFile> projectFiles = files.entrySet().stream()
                    .map(entry -> new ProjectFile(
                            project.getId(),
                            entry.getKey(),
                            entry.getValue(),
                            entry.getValue().getBytes(StandardCharsets.UTF_8).length))
                    .toList();
            projectFileRepository.saveAll(projectFiles);
            return project;
        });

        ProjectImportResponse response = ProjectImportResponse.of(saved, fileCount, versionHash, skipped);
        messagingTemplate.convertAndSend(
                "/topic/sessions/" + sessionId + "/project",
                ProjectImportNotification.from(response));
        return response;
    }

    /**
     * 저장 내용의 SHA-256. 같은 코드는 같은 해시가 나오므로 퀴즈 생성 요청의 version_hash 로 쓸 수 있다.
     * 순서에 따라 값이 흔들리지 않도록 sanitize 가 경로 정렬을 보장한다.
     */
    private String versionHashOf(Map<String, String> files) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (Map.Entry<String, String> entry : files.entrySet()) {
                digest.update(entry.getKey().getBytes(StandardCharsets.UTF_8));
                digest.update((byte)0);
                digest.update(entry.getValue().getBytes(StandardCharsets.UTF_8));
                digest.update((byte)0);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 을 사용할 수 없습니다.", e);
        }
    }

    private Project findProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다: " + projectId));
    }
}
