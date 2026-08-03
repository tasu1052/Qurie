package com.roma.qurie.session.voice.dto;

/**
 * 음성 채널 참여자 한 명의 상태. micMuted 는 마이크만 끈 상태, deafened 는 헤드셋(수신)까지 끈 상태다.
 * deafened 가 true 면 micMuted 도 항상 true 다 — 레지스트리가 강제한다.
 */
public record VoiceParticipantResponse(
		Long userId,
		String name,
		String role,
		boolean micMuted,
		boolean deafened) {
}
