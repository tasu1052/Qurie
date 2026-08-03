package com.roma.qurie.invitation;

import com.roma.qurie.invitation.dto.BulkInvitationResponse;
import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.invitation.dto.InvitationCreateResponse;
import com.roma.qurie.invitation.dto.InvitationPreviewResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.UserRole;
import jakarta.validation.Valid;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

	private final InvitationService invitationService;
	private final BulkInvitationService bulkInvitationService;

	/** 초대 생성. 마스터는 매니저를, 매니저는 자기 반의 학생을 초대한다. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public InvitationCreateResponse create(
			@Valid @RequestBody InvitationCreateRequest request,
			@AuthenticationPrincipal AuthUser inviter) {
		return invitationService.create(inviter, request);
	}

	/**
	 * 엑셀(xlsx/xls)·CSV 파일의 이메일로 초대를 일괄 발송한다. 반과 역할은 파일이 아니라 요청 파라미터로 받는다 —
	 * 파일마다 열 이름이 달라 역할·반까지 파일에서 읽으면 실패 원인이 사용자에게 설명하기 어려워진다.
	 *
	 * 한 행이 실패해도 나머지는 발송되며, 행별 결과를 200 으로 돌려준다.
	 */
	@PostMapping(path = "/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public BulkInvitationResponse createBulk(
			@RequestPart("file") MultipartFile file,
			@RequestParam("classId") Long classId,
			@RequestParam("role") UserRole role,
			@AuthenticationPrincipal AuthUser inviter) {
		try {
			return bulkInvitationService.inviteFromFile(
					inviter, classId, role, file.getOriginalFilename(), file.getBytes());
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드한 파일을 읽지 못했습니다.", e);
		}
	}

	/**
	 * 초대 링크로 열린 가입 화면을 채우기 위한 조회.
	 * 아직 계정이 없는 사람이 부르는 경로라 로그인을 요구하지 않는다 — 토큰 자체가 증표다.
	 */
	@GetMapping("/{token}")
	public InvitationPreviewResponse preview(@PathVariable String token) {
		return invitationService.preview(token);
	}
}
