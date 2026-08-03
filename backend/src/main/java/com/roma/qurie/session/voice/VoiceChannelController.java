package com.roma.qurie.session.voice;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.voice.dto.VoiceParticipantResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions/{sessionId}/voice")
@RequiredArgsConstructor
public class VoiceChannelController {

	private final VoiceChannelService voiceChannelService;

	/** 현재 통화 중인 참여자 목록. 세션 화면 첫 렌더가 이 값으로 음성 상태 아이콘을 그린다 */
	@GetMapping("/participants")
	public List<VoiceParticipantResponse> participants(
			@AuthenticationPrincipal AuthUser requester,
			@PathVariable("sessionId") Long sessionId) {
		return voiceChannelService.getParticipants(sessionId, requester);
	}
}
