package com.roma.qurie.session.voice.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 마이크/헤드셋 버튼 상태 변경. 두 값을 함께 받는 이유는 버튼 조합(마이크만, 헤드셋+마이크)을
 * 클라이언트가 계산해 보내되 최종 일관성(deafened → micMuted)은 서버가 보정하기 위해서다.
 */
public record VoiceStateUpdateRequest(
		@NotNull Boolean micMuted,
		@NotNull Boolean deafened) {
}
