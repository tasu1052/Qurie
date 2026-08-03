package com.roma.qurie.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.dto.ProjectFileContentResponse;
import com.roma.qurie.project.dto.ProjectImportGitRequest;
import com.roma.qurie.project.dto.ProjectImportLocalRequest;
import com.roma.qurie.project.dto.ProjectImportResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProjectServiceTest {

	private static final Long SESSION_ID = 3L;
	private static final Long PROJECT_ID = 11L;

	@Mock
	private ProjectRepository projectRepository;

	@Mock
	private ProjectFileRepository projectFileRepository;

	@Mock
	private SessionParticipantService participantService;

	@Mock
	private GitProjectReader gitProjectReader;

	@Mock
	private TransactionTemplate transactionTemplate;

	@InjectMocks
	private ProjectService projectService;

	@BeforeEach
	void passThroughTransaction() {
		given(transactionTemplate.execute(any())).willAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(org.mockito.Mockito.mock(TransactionStatus.class));
		});
		given(projectRepository.save(any(Project.class))).willAnswer(invocation -> {
			Project project = invocation.getArgument(0);
			ReflectionTestUtils.setField(project, "id", PROJECT_ID);
			return project;
		});
	}

	@Test
	void importLocalStoresSanitizedFilesAndReturnsVersionHash() {
		ProjectImportResponse response = projectService.importLocal(student(), new ProjectImportLocalRequest(
				SESSION_ID, Map.of(
						"src\\Main.java", "class Main {}",
						"node_modules/x.js", "skip me")));

		assertThat(response.projectId()).isEqualTo(PROJECT_ID);
		assertThat(response.fileCount()).isEqualTo(1);
		assertThat(response.versionHash()).hasSize(64);
		assertThat(response.skippedFiles()).hasSize(1);

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<ProjectFile>> captor = ArgumentCaptor.forClass((Class)List.class);
		verify(projectFileRepository).saveAll(captor.capture());
		ProjectFile stored = captor.getValue().get(0);
		assertThat(stored.getProjectId()).isEqualTo(PROJECT_ID);
		assertThat(stored.getPath()).isEqualTo("src/Main.java");
		assertThat(stored.getByteSize()).isEqualTo("class Main {}".length());
	}

	@Test
	void importLocalRequiresGroupLeader() {
		given(participantService.verifyCanImportProject(eq(SESSION_ID), any(AuthUser.class)))
				.willThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "프로젝트 임포트는 그룹 리더만 할 수 있습니다."));

		assertThatThrownBy(() -> projectService.importLocal(student(),
				new ProjectImportLocalRequest(SESSION_ID, Map.of("a.txt", "x"))))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ProjectServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(projectRepository, org.mockito.Mockito.never()).save(any(Project.class));
	}

	@Test
	void getCurrentProjectReturnsLatestImportOfTheSession() {
		Project latest = new Project(SESSION_ID, null, 7L);
		ReflectionTestUtils.setField(latest, "id", PROJECT_ID);
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID))
				.willReturn(Optional.of(latest));

		assertThat(projectService.getCurrentProject(student(), SESSION_ID).id()).isEqualTo(PROJECT_ID);
		verify(participantService).verifyCanEnter(eq(SESSION_ID), any(AuthUser.class));
	}

	@Test
	void getCurrentProjectThrowsNotFoundWhenNothingImported() {
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID))
				.willReturn(Optional.empty());

		assertThatThrownBy(() -> projectService.getCurrentProject(student(), SESSION_ID))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ProjectServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void importGitMergesReaderSkipsWithSanitizerSkipsAndStoresRepoUrl() {
		given(gitProjectReader.readFiles("https://github.com/foo/bar.git", null, null, null))
				.willReturn(new GitProjectReader.ReadResult(
						Map.of("src/app.py", "print(1)", "dist/bundle.js", "x"),
						List.of(new ImportedFileSanitizer.SkippedFile("logo.png", "바이너리 파일"))));

		ProjectImportResponse response = projectService.importGit(student(), new ProjectImportGitRequest(
				SESSION_ID, "https://github.com/foo/bar.git", null, null, null));

		assertThat(response.fileCount()).isEqualTo(1);
		assertThat(response.skippedFiles())
				.extracting(ProjectImportResponse.SkippedFileResponse::path)
				.containsExactlyInAnyOrder("logo.png", "dist/bundle.js");

		ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
		verify(projectRepository).save(captor.capture());
		assertThat(captor.getValue().getPath()).isEqualTo("https://github.com/foo/bar.git");
	}

	@Test
	void importGitForwardsPatToReaderWithoutStoringIt() {
		given(gitProjectReader.readFiles("https://github.com/foo/private.git", "main", null, "glpat-secret"))
				.willReturn(new GitProjectReader.ReadResult(Map.of("src/app.py", "print(1)"), List.of()));

		projectService.importGit(student(), new ProjectImportGitRequest(
				SESSION_ID, "https://github.com/foo/private.git", "main", null, "glpat-secret"));

		ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
		verify(projectRepository).save(captor.capture());
		// 저장되는 path 는 repo URL 그대로여야 하고, 토큰이 어디에도 섞여 들어가면 안 된다.
		assertThat(captor.getValue().getPath()).isEqualTo("https://github.com/foo/private.git");
	}

	@Test
	void sameFilesProduceSameVersionHashRegardlessOfInputOrder() {
		ProjectImportResponse first = projectService.importLocal(student(), new ProjectImportLocalRequest(
				SESSION_ID, new java.util.LinkedHashMap<>(Map.of("a.txt", "1", "b.txt", "2"))));
		java.util.LinkedHashMap<String, String> reversed = new java.util.LinkedHashMap<>();
		reversed.put("b.txt", "2");
		reversed.put("a.txt", "1");
		ProjectImportResponse second = projectService.importLocal(student(), new ProjectImportLocalRequest(
				SESSION_ID, reversed));

		assertThat(first.versionHash()).isEqualTo(second.versionHash());
	}

	@Test
	void getFileContentThrowsNotFoundWhenPathMissing() {
		given(projectRepository.findById(PROJECT_ID))
				.willReturn(Optional.of(new Project(SESSION_ID, null, 7L)));
		given(projectFileRepository.findByProjectIdAndPath(PROJECT_ID, "none.txt"))
				.willReturn(Optional.empty());

		assertThatThrownBy(() -> projectService.getFileContent(student(), PROJECT_ID, "none.txt"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ProjectServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void getFileContentReturnsStoredContent() {
		given(projectRepository.findById(PROJECT_ID))
				.willReturn(Optional.of(new Project(SESSION_ID, null, 7L)));
		given(projectFileRepository.findByProjectIdAndPath(PROJECT_ID, "src/Main.java"))
				.willReturn(Optional.of(new ProjectFile(PROJECT_ID, "src/Main.java", "class Main {}", 13)));

		ProjectFileContentResponse response = projectService.getFileContent(student(), PROJECT_ID, "src/Main.java");

		assertThat(response.content()).isEqualTo("class Main {}");
		verify(participantService).verifyCanEnter(eq(SESSION_ID), any(AuthUser.class));
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}

	private AuthUser student() {
		return new AuthUser(7L, "STUDENT", 1L, "student@qurie.com", "학생", 5L);
	}
}
