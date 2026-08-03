package com.roma.qurie.material;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.material.dto.ClassMaterialResponse;
import com.roma.qurie.material.dto.ClassMaterialSummary;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * 강의자료 업로드/목록/다운로드/삭제.
 *
 * 권한은 반 명단(class_users) 기준이다 — 업로드·삭제는 그 반의 강사(MANAGER)만, 목록·다운로드는
 * 반 구성원 전체. 마스터는 명단에 담기지 않아 대상이 아니다(세션 입장과 같은 정책).
 */
@Service
@RequiredArgsConstructor
public class ClassMaterialService {

	static final long MAX_FILE_BYTES = 30L * 1024 * 1024;

	private static final String MANAGER_ROLE = "MANAGER";
	private static final String LOGIN_REQUIRED_MESSAGE = "로그인이 필요합니다.";
	private static final String CLASS_NOT_FOUND_MESSAGE = "클래스를 찾을 수 없습니다.";
	private static final String NOT_CLASS_MEMBER_MESSAGE = "이 반에 소속된 사용자만 강의자료를 볼 수 있습니다.";
	private static final String NOT_CLASS_MANAGER_MESSAGE = "강의자료 업로드는 반의 강사만 할 수 있습니다.";
	private static final String MATERIAL_NOT_FOUND_MESSAGE = "강의자료를 찾을 수 없습니다.";
	private static final String UNKNOWN_UPLOADER_NAME = "알 수 없음";

	private final ClassMaterialRepository materialRepository;
	private final ClassRepository classRepository;
	private final ClassUserRepository classUserRepository;
	private final UserRepository userRepository;

	@Transactional
	public ClassMaterialResponse upload(Long classId, MultipartFile file, AuthUser requester) {
		verifyClassManager(classId, requester);

		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드할 파일이 비어 있습니다.");
		}
		if (file.getSize() > MAX_FILE_BYTES) {
			throw new ResponseStatusException(
					HttpStatus.PAYLOAD_TOO_LARGE, "파일당 크기 상한(" + MAX_FILE_BYTES / (1024 * 1024) + "MB)을 초과했습니다.");
		}

		byte[] data;
		try {
			data = file.getBytes();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "업로드 파일을 읽지 못했습니다.", e);
		}

		ClassMaterial saved = materialRepository.save(new ClassMaterial(
				classId,
				sanitizeFileName(file.getOriginalFilename()),
				sanitizeContentType(file.getContentType()),
				data,
				requester.id()));
		return ClassMaterialResponse.of(saved, requester.name());
	}

	@Transactional(readOnly = true)
	public List<ClassMaterialResponse> getMaterials(Long classId, AuthUser requester) {
		verifyClassMember(classId, requester);

		List<ClassMaterialSummary> summaries = materialRepository.findSummariesByClassId(classId);
		Map<Long, String> uploaderNames = userRepository.findAllById(
						summaries.stream().map(ClassMaterialSummary::uploadedBy).distinct().toList())
				.stream()
				.collect(Collectors.toMap(User::getId, User::getName));

		return summaries.stream()
				.map(summary -> ClassMaterialResponse.of(
						summary, uploaderNames.getOrDefault(summary.uploadedBy(), UNKNOWN_UPLOADER_NAME)))
				.toList();
	}

	/** 다운로드용 단건 조회. 여기서만 파일 본문을 DB 에서 읽는다. */
	@Transactional(readOnly = true)
	public Download download(Long classId, Long materialId, AuthUser requester) {
		verifyClassMember(classId, requester);

		ClassMaterial material = findMaterialOfClass(classId, materialId);
		return new Download(material.getFileName(), material.getContentType(), material.getData());
	}

	@Transactional
	public void delete(Long classId, Long materialId, AuthUser requester) {
		verifyClassManager(classId, requester);

		materialRepository.delete(findMaterialOfClass(classId, materialId));
	}

	/** 다른 반의 자료 id 를 URL 에 끼워 넣는 접근을 막는다 — 존재 여부를 숨기기 위해 같은 404 로 응답한다. */
	private ClassMaterial findMaterialOfClass(Long classId, Long materialId) {
		return materialRepository.findById(materialId)
				.filter(material -> material.getClassId().equals(classId))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, MATERIAL_NOT_FOUND_MESSAGE));
	}

	private void verifyClassManager(Long classId, AuthUser requester) {
		verifyClassMember(classId, requester);
		if (!MANAGER_ROLE.equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_CLASS_MANAGER_MESSAGE);
		}
	}

	private void verifyClassMember(Long classId, AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, LOGIN_REQUIRED_MESSAGE);
		}
		if (!classRepository.existsById(classId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, CLASS_NOT_FOUND_MESSAGE);
		}
		if (!classUserRepository.existsByClassEntityIdAndUserId(classId, requester.id())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_CLASS_MEMBER_MESSAGE);
		}
	}

	/** 브라우저·OS가 보내는 경로 구분자를 제거해 파일명만 남긴다. 저장 컬럼(255자)도 여기서 지킨다. */
	static String sanitizeFileName(String originalName) {
		if (originalName == null || originalName.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 이름이 없습니다.");
		}
		String name = originalName.replace("\\", "/");
		name = name.substring(name.lastIndexOf('/') + 1).trim();
		if (name.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 이름이 올바르지 않습니다.");
		}
		if (name.length() > 255) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 이름이 너무 깁니다. (최대 255자)");
		}
		return name;
	}

	/** 클라이언트가 보낸 Content-Type 이 비었거나 파싱 불가능하면 octet-stream 으로 저장한다. */
	static String sanitizeContentType(String contentType) {
		if (contentType == null || contentType.isBlank() || contentType.length() > 100) {
			return MediaType.APPLICATION_OCTET_STREAM_VALUE;
		}
		try {
			MediaType.parseMediaType(contentType);
			return contentType;
		} catch (IllegalArgumentException e) {
			return MediaType.APPLICATION_OCTET_STREAM_VALUE;
		}
	}

	public record Download(String fileName, String contentType, byte[] data) {
	}
}
