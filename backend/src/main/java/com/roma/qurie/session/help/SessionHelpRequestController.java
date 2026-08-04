package com.roma.qurie.session.help;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.help.SessionHelpRequestService.HelpRequestResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SessionHelpRequestController {

	private final SessionHelpRequestService helpRequestService;

	/** 세션에서 강사 호출(질문하기). */
	@PostMapping("/sessions/{sessionId}/help")
	@ResponseStatus(HttpStatus.CREATED)
	public HelpRequestResponse askHelp(
			@PathVariable("sessionId") Long sessionId,
			@AuthenticationPrincipal AuthUser requester) {
		return helpRequestService.create(sessionId, requester);
	}

	/** 반 매니저용 미처리 질문 알림 목록. */
	@GetMapping("/classes/{classId}/help-requests")
	public List<HelpRequestResponse> list(
			@PathVariable("classId") Long classId,
			@AuthenticationPrincipal AuthUser requester) {
		return helpRequestService.listForClass(classId, requester);
	}

	@DeleteMapping("/help-requests/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void dismiss(
			@PathVariable("id") Long id,
			@AuthenticationPrincipal AuthUser requester) {
		helpRequestService.dismiss(id, requester);
	}
}
