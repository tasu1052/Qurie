package com.roma.qurie.material;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.roma.qurie.material.dto.ClassMaterialResponse;
import com.roma.qurie.security.AuthUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classes/{classId}/materials")
@RequiredArgsConstructor
public class ClassMaterialController {

	private final ClassMaterialService materialService;

	/** 강의자료 업로드 (반의 강사 전용). multipart 의 file 파트 하나를 받는다 */
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ClassMaterialResponse> upload(
			@AuthenticationPrincipal AuthUser requester,
			@PathVariable("classId") Long classId,
			@RequestParam("file") MultipartFile file) {
		ClassMaterialResponse response = materialService.upload(classId, file, requester);
		return ResponseEntity
				.created(URI.create("/api/classes/" + classId + "/materials/" + response.id()))
				.body(response);
	}

	/** 강의자료 목록 (반 구성원). 파일 본문 없이 메타데이터만 내려간다 */
	@GetMapping
	public List<ClassMaterialResponse> list(
			@AuthenticationPrincipal AuthUser requester,
			@PathVariable("classId") Long classId) {
		return materialService.getMaterials(classId, requester);
	}

	/** 강의자료 다운로드 (반 구성원). 브라우저가 저장하도록 attachment 로 내린다 */
	@GetMapping("/{materialId}/download")
	public ResponseEntity<byte[]> download(
			@AuthenticationPrincipal AuthUser requester,
			@PathVariable("classId") Long classId,
			@PathVariable("materialId") Long materialId) {
		ClassMaterialService.Download download = materialService.download(classId, materialId, requester);

		// filename* (RFC 5987) 인코딩까지 ContentDisposition 빌더가 처리한다 — 한글 파일명 대비.
		ContentDisposition disposition = ContentDisposition.attachment()
				.filename(download.fileName(), StandardCharsets.UTF_8)
				.build();
		return ResponseEntity.ok()
				.header("Content-Disposition", disposition.toString())
				.contentType(MediaType.parseMediaType(download.contentType()))
				.body(download.data());
	}

	/** 강의자료 삭제 (반의 강사 전용) */
	@DeleteMapping("/{materialId}")
	public ResponseEntity<Void> delete(
			@AuthenticationPrincipal AuthUser requester,
			@PathVariable("classId") Long classId,
			@PathVariable("materialId") Long materialId) {
		materialService.delete(classId, materialId, requester);
		return ResponseEntity.noContent().build();
	}
}
