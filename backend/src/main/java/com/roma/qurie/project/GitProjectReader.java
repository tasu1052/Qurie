package com.roma.qurie.project;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.ImportedFileSanitizer.SkippedFile;

/**
 * Git 저장소를 임시 디렉터리에 shallow clone 해서 텍스트 파일을 읽어 온다.
 *
 * 사용자가 지정한 URL 로 서버가 나가서 접속하는 기능이라 SSRF 방어가 필수다 —
 * https 만 허용하고 내부망·루프백·메타데이터 주소로 풀리는 호스트를 거부한다.
 * 비공개 저장소는 요청에 실려 온 PAT 로만 인증한다. 토큰은 이 clone 한 번에만 쓰고
 * 저장하지 않는다 — URL 에 토큰을 담는 방식은 로그·에러 메시지에 노출되므로 계속 거부한다.
 */
@Component
public class GitProjectReader {

	private static final int CLONE_TIMEOUT_SECONDS = 30;
	/** clone 결과가 상한(500개)의 몇 배를 넘으면 걷기를 멈추고 즉시 거부한다. 대형 repo 메모리 방어용. */
	private static final int WALK_HARD_LIMIT = ImportedFileSanitizer.MAX_FILE_COUNT * 4;

	public record ReadResult(Map<String, String> files, List<SkippedFile> skipped) {
	}

	public ReadResult readFiles(String repoUrl, String branch, String subPath, String pat) {
		URI uri = validateRepoUrl(repoUrl);

		Path cloneDir;
		try {
			cloneDir = Files.createTempDirectory("qurie-git-import-");
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "임시 저장 공간을 만들지 못했습니다.", e);
		}

		try {
			cloneShallow(uri, branch, cloneDir, pat);
			Path root = resolveSubPath(cloneDir, subPath);
			return readTextFiles(root);
		} finally {
			deleteRecursively(cloneDir);
		}
	}

	/**
	 * https + 공인 호스트만 통과시킨다. 호스트를 실제로 resolve 해서 검사한다 —
	 * 문자열 검사만 하면 내부 IP 를 가리키는 도메인으로 우회된다.
	 */
	static URI validateRepoUrl(String repoUrl) {
		URI uri;
		try {
			uri = URI.create(repoUrl.trim());
		} catch (IllegalArgumentException e) {
			throw badRequest("저장소 URL 형식이 올바르지 않습니다.");
		}
		if (!"https".equalsIgnoreCase(uri.getScheme())) {
			throw badRequest("https 저장소 URL 만 지원합니다.");
		}
		if (uri.getUserInfo() != null) {
			throw badRequest("URL 에 인증 정보를 담을 수 없습니다.");
		}
		String host = uri.getHost();
		if (host == null || host.isBlank()) {
			throw badRequest("저장소 URL 에 호스트가 없습니다.");
		}

		InetAddress[] addresses;
		try {
			addresses = InetAddress.getAllByName(host);
		} catch (UnknownHostException e) {
			throw badRequest("저장소 호스트를 찾을 수 없습니다: " + host);
		}
		for (InetAddress address : addresses) {
			if (address.isLoopbackAddress() || address.isSiteLocalAddress()
					|| address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
				throw badRequest("내부 네트워크 주소로는 가져올 수 없습니다.");
			}
		}
		return uri;
	}

	private void cloneShallow(URI uri, String branch, Path cloneDir, String pat) {
		try {
			CloneCommand clone = Git.cloneRepository()
					.setURI(uri.toString())
					.setDirectory(cloneDir.toFile())
					.setDepth(1)
					.setCloneAllBranches(false)
					.setBranch(branch == null || branch.isBlank() ? null : branch)
					.setTimeout(CLONE_TIMEOUT_SECONDS);
			if (pat != null && !pat.isBlank()) {
				// GitHub·GitLab 모두 사용자명은 검사하지 않고 비밀번호 자리의 토큰만 본다.
				clone.setCredentialsProvider(new UsernamePasswordCredentialsProvider("oauth2", pat.trim()));
			}
			clone.call().close();
		} catch (GitAPIException e) {
			// 비공개/없는 repo, 없는 브랜치, 네트워크 실패가 전부 여기로 온다. 원인은 메시지로 전달한다.
			throw new ResponseStatusException(
					HttpStatus.UNPROCESSABLE_ENTITY, "저장소를 가져오지 못했습니다: " + e.getMessage(), e);
		}
	}

	/** 모노레포에서 하위 폴더만 가져올 때. clone 디렉터리 밖으로 나가는 경로는 거부한다. */
	private Path resolveSubPath(Path cloneDir, String subPath) {
		if (subPath == null || subPath.isBlank()) {
			return cloneDir;
		}
		Path resolved = cloneDir.resolve(subPath.trim()).normalize();
		if (!resolved.startsWith(cloneDir)) {
			throw badRequest("하위 경로가 저장소 밖을 가리킵니다.");
		}
		if (!Files.isDirectory(resolved)) {
			throw badRequest("저장소에 해당 하위 경로가 없습니다: " + subPath);
		}
		return resolved;
	}

	private ReadResult readTextFiles(Path root) {
		Map<String, String> files = new LinkedHashMap<>();
		List<SkippedFile> skipped = new ArrayList<>();

		try (Stream<Path> walk = Files.walk(root, FileVisitOption.FOLLOW_LINKS)) {
			List<Path> regularFiles = walk.filter(Files::isRegularFile).limit(WALK_HARD_LIMIT + 1L).toList();
			if (regularFiles.size() > WALK_HARD_LIMIT) {
				throw new ResponseStatusException(
						HttpStatus.PAYLOAD_TOO_LARGE, "저장소 파일이 너무 많습니다. 하위 경로(subPath)로 범위를 좁혀 주세요.");
			}
			for (Path file : regularFiles) {
				String relativePath = root.relativize(file).toString().replace("\\", "/");
				readOne(file, relativePath, files, skipped);
			}
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "저장소 파일을 읽지 못했습니다.", e);
		}

		return new ReadResult(files, skipped);
	}

	/** UTF-8 로 디코딩되지 않으면 바이너리로 보고 걸러낸다. 크기 상한 초과는 읽기 전에 거른다. */
	private void readOne(Path file, String relativePath, Map<String, String> files, List<SkippedFile> skipped) {
		try {
			if (Files.size(file) > ImportedFileSanitizer.MAX_FILE_BYTES) {
				skipped.add(new SkippedFile(relativePath, "파일당 크기 상한(" + ImportedFileSanitizer.MAX_FILE_BYTES / 1_000 + "KB) 초과"));
				return;
			}
			byte[] bytes = Files.readAllBytes(file);
			String content = StandardCharsets.UTF_8.newDecoder()
					.onMalformedInput(CodingErrorAction.REPORT)
					.onUnmappableCharacter(CodingErrorAction.REPORT)
					.decode(java.nio.ByteBuffer.wrap(bytes))
					.toString();
			files.put(relativePath, content);
		} catch (CharacterCodingException e) {
			skipped.add(new SkippedFile(relativePath, "바이너리 파일"));
		} catch (IOException e) {
			skipped.add(new SkippedFile(relativePath, "읽기 실패"));
		}
	}

	private void deleteRecursively(Path directory) {
		try (Stream<Path> walk = Files.walk(directory)) {
			walk.sorted(Comparator.reverseOrder()).forEach(path -> path.toFile().delete());
		} catch (IOException e) {
			// 임시 디렉터리 정리 실패는 임포트 결과에 영향이 없다. OS tmp 정리에 맡긴다.
		}
	}

	private static ResponseStatusException badRequest(String message) {
		return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
	}
}
