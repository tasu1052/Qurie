package com.roma.qurie.project;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * 임포트된 파일 묶음의 검증·정리. 로컬 업로드(JSON)와 Git 클론 결과가 같은 규칙을 거친다.
 *
 * 경로는 클라이언트/저장소가 준 값이라 신뢰할 수 없다 — 상위 탈출(..), 절대경로를 거르고,
 * 빌드 산출물·의존성 디렉터리처럼 출제·편집 대상이 아닌 파일을 제외한다.
 * 걸러진 파일은 이유와 함께 돌려줘서 사용자가 "왜 안 올라갔는지" 알 수 있게 한다.
 */
public final class ImportedFileSanitizer {

	public static final int MAX_FILE_COUNT = 500;
	public static final int MAX_FILE_BYTES = 200_000;
	public static final long MAX_TOTAL_BYTES = 10_000_000L;

	/** 의존성·빌드 산출물·IDE 설정. 경로의 어느 세그먼트에 있어도 제외한다. */
	private static final Set<String> EXCLUDED_SEGMENTS = Set.of(
			"node_modules", ".git", "dist", "build", "target", "out",
			".idea", ".vscode", "__pycache__", "venv", ".venv", ".gradle");

	private ImportedFileSanitizer() {
	}

	public record SkippedFile(String path, String reason) {
	}

	public record Result(Map<String, String> files, List<SkippedFile> skipped) {
	}

	/**
	 * @return 경로 정렬 순서가 유지되는 파일 맵과 걸러진 파일 목록
	 * @throws ResponseStatusException 남는 파일이 없으면 422, 개수·총량 상한을 넘으면 413
	 */
	public static Result sanitize(Map<String, String> rawFiles) {
		Map<String, String> accepted = new TreeMap<>();
		List<SkippedFile> skipped = new ArrayList<>();
		long totalBytes = 0;

		for (Map.Entry<String, String> entry : rawFiles.entrySet()) {
			String rawPath = entry.getKey() == null ? "" : entry.getKey();
			String content = entry.getValue() == null ? "" : entry.getValue();
			String path = normalize(rawPath);

			String rejectReason = rejectReasonOf(path, content);
			if (rejectReason != null) {
				skipped.add(new SkippedFile(rawPath, rejectReason));
				continue;
			}
			if (accepted.containsKey(path)) {
				skipped.add(new SkippedFile(rawPath, "중복 경로"));
				continue;
			}

			accepted.put(path, content);
			totalBytes += content.getBytes(StandardCharsets.UTF_8).length;
		}

		if (accepted.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "가져올 텍스트 파일이 없습니다.");
		}
		if (accepted.size() > MAX_FILE_COUNT) {
			throw new ResponseStatusException(
					HttpStatus.PAYLOAD_TOO_LARGE, "파일이 너무 많습니다. 최대 " + MAX_FILE_COUNT + "개까지 가져올 수 있습니다.");
		}
		if (totalBytes > MAX_TOTAL_BYTES) {
			throw new ResponseStatusException(
					HttpStatus.PAYLOAD_TOO_LARGE, "전체 용량이 너무 큽니다. 최대 " + MAX_TOTAL_BYTES / 1_000_000 + "MB 까지 가져올 수 있습니다.");
		}

		return new Result(new LinkedHashMap<>(accepted), List.copyOf(skipped));
	}

	private static String normalize(String rawPath) {
		String path = rawPath.trim().replace("\\", "/");
		while (path.startsWith("./")) {
			path = path.substring(2);
		}
		while (path.startsWith("/")) {
			path = path.substring(1);
		}
		return path;
	}

	private static String rejectReasonOf(String path, String content) {
		if (path.isBlank()) {
			return "빈 경로";
		}
		if (path.length() > 500) {
			return "경로가 너무 깁니다";
		}
		// 드라이브 문자(C:)나 .. 세그먼트는 저장 경로 규칙을 벗어난다.
		if (path.contains(":")) {
			return "절대 경로는 허용되지 않습니다";
		}
		for (String segment : path.split("/")) {
			if (segment.equals("..")) {
				return "상위 디렉터리 참조(..) 경로";
			}
			if (EXCLUDED_SEGMENTS.contains(segment)) {
				return "제외 디렉터리(" + segment + ")";
			}
		}
		if (content.indexOf('\0') >= 0) {
			return "바이너리 파일";
		}
		if (content.getBytes(StandardCharsets.UTF_8).length > MAX_FILE_BYTES) {
			return "파일당 크기 상한(" + MAX_FILE_BYTES / 1_000 + "KB) 초과";
		}
		return null;
	}
}
