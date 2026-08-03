package com.roma.qurie.report.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.report.service.ReportExportService;

import lombok.RequiredArgsConstructor;

/**
 * 리포트 내보내기(다운로드) 컨트롤러. 리포트 발급(생성)은 리소스 소유 컨트롤러
 * (UserController·SessionController)에 있지만, 내보내기는 JSON 이 아닌 파일 응답이라 report 패키지에 모아 둔다.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

	private final ReportExportService reportExportService;

	/**
	 * 사용자 최종 리포트 PDF 다운로드. 리포트는 (사용자, 클래스)당 1건이라 두 값으로 특정한다.
	 *
	 * @param ordinaryUserId: 리포트 대상 사용자 id
	 * @param classId: 리포트가 발급된 클래스 id
	 */
	@GetMapping("/users/{userId}/export")
	public ResponseEntity<byte[]> exportUserReport(@PathVariable("userId") Long ordinaryUserId,
			@RequestParam("classId") Long classId) {
		byte[] pdf = reportExportService.exportUserReportPdf(ordinaryUserId, classId);

		return pdfResponse(pdf, "user-report-" + ordinaryUserId + "-class-" + classId + ".pdf");
	}

	/**
	 * 세션 리포트 PDF 다운로드. 리포트는 (세션, 사용자)당 1건이라 두 값으로 특정한다.
	 *
	 * @param sessionId: 리포트가 발급된 세션 id
	 * @param ordinaryUserId: 리포트 대상 사용자 id
	 */
	@GetMapping("/sessions/{sessionId}/export")
	public ResponseEntity<byte[]> exportSessionReport(@PathVariable("sessionId") Long sessionId,
			@RequestParam("userId") Long ordinaryUserId) {
		byte[] pdf = reportExportService.exportSessionReportPdf(sessionId, ordinaryUserId);

		return pdfResponse(pdf, "session-report-" + sessionId + "-user-" + ordinaryUserId + ".pdf");
	}

	private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
		ContentDisposition disposition = ContentDisposition.attachment()
				.filename(filename)
				.build();
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.body(pdf);
	}
}
