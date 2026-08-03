package com.roma.qurie.session.voice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * WebRTC 시그널 중계 요청. payload 는 SDP(offer/answer) 또는 ICE candidate 를 담은
 * JSON 문자열이며 서버는 내용을 해석하지 않고 대상에게 그대로 전달만 한다.
 */
public record VoiceSignalRequest(
		@NotNull Long targetUserId,
		@NotBlank @Pattern(regexp = "offer|answer|candidate") String type,
		@NotBlank @Size(max = 32768) String payload) {
}
