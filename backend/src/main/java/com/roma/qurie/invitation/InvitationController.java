package com.roma.qurie.invitation;

import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.invitation.dto.InvitationCreateResponse;
import com.roma.qurie.invitation.dto.InvitationPreviewResponse;
import com.roma.qurie.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

	private final InvitationService invitationService;

	/** 초대 생성. 마스터는 매니저를, 매니저는 자기 반의 학생을 초대한다. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public InvitationCreateResponse create(
			@Valid @RequestBody InvitationCreateRequest request,
			@AuthenticationPrincipal AuthUser inviter) {
		return invitationService.create(inviter, request);
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
