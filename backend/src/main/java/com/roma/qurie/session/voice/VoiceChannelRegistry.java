package com.roma.qurie.session.voice;

import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import com.roma.qurie.session.voice.dto.VoiceParticipantResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * 세션별 음성 채널 참여 상태를 메모리에 보관한다. 음성 미디어는 브라우저끼리 WebRTC P2P 로 흐르므로
 * 서버는 누가 채널에 있고 어떤 상태(마이크 음소거·헤드셋 음소거)인지만 알면 된다.
 *
 * SessionPresenceRegistry 와 달리 사용자당 연결 하나만 유지한다 — 같은 계정이 두 탭에서
 * 동시에 마이크를 잡는 상황을 만들지 않기 위해, 재참여 시 이전 참여를 대체한다.
 */
@Component
public class VoiceChannelRegistry {

	private final Map<Long, Map<Long, Member>> membersBySession = new HashMap<>();
	private final Map<String, Set<VoiceKey>> keysByConnection = new HashMap<>();

	/** 채널 참여. 이미 참여 중이면(다른 탭 등) 이전 참여를 끊긴 것으로 보고 대체하며, 상태는 초기화된다. */
	public synchronized JoinResult join(
			Long sessionId,
			String connectionId,
			SessionParticipantResponse participant) {
		removeMember(sessionId, participant.userId());

		Member member = new Member(participant, connectionId);
		membersBySession.computeIfAbsent(sessionId, key -> new HashMap<>()).put(participant.userId(), member);
		keysByConnection.computeIfAbsent(connectionId, key -> new HashSet<>())
				.add(new VoiceKey(sessionId, participant.userId()));

		return new JoinResult(member.toResponse(), participants(sessionId));
	}

	public synchronized Optional<Departure> leave(Long sessionId, Long userId) {
		return removeMember(sessionId, userId)
				.map(member -> new Departure(sessionId, member.toResponse(), participants(sessionId)));
	}

	/** WebSocket 연결이 끊기면 그 연결로 참여했던 음성 채널에서 모두 내보낸다. */
	public synchronized List<Departure> disconnect(String connectionId) {
		Set<VoiceKey> keys = keysByConnection.get(connectionId);
		if (keys == null) {
			return List.of();
		}

		List<Departure> departures = new ArrayList<>();
		for (VoiceKey key : Set.copyOf(keys)) {
			removeMember(key.sessionId(), key.userId())
					.ifPresent(member -> departures.add(new Departure(
							key.sessionId(),
							member.toResponse(),
							participants(key.sessionId()))));
		}
		return List.copyOf(departures);
	}

	/** 헤드셋 음소거는 마이크 음소거를 함의한다 — 서버가 강제해 참가자 간 표시가 어긋나지 않게 한다. */
	public synchronized Optional<VoiceParticipantResponse> updateState(
			Long sessionId,
			Long userId,
			boolean micMuted,
			boolean deafened) {
		Member member = findMember(sessionId, userId);
		if (member == null) {
			return Optional.empty();
		}
		member.deafened = deafened;
		member.micMuted = deafened || micMuted;
		return Optional.of(member.toResponse());
	}

	public synchronized boolean isMember(Long sessionId, Long userId) {
		return findMember(sessionId, userId) != null;
	}

	public synchronized List<VoiceParticipantResponse> participants(Long sessionId) {
		Map<Long, Member> members = membersBySession.get(sessionId);
		if (members == null) {
			return List.of();
		}
		return members.values().stream()
				.map(Member::toResponse)
				.sorted(Comparator.comparing(VoiceParticipantResponse::userId))
				.toList();
	}

	private Member findMember(Long sessionId, Long userId) {
		Map<Long, Member> members = membersBySession.get(sessionId);
		return members == null ? null : members.get(userId);
	}

	private Optional<Member> removeMember(Long sessionId, Long userId) {
		Map<Long, Member> members = membersBySession.get(sessionId);
		if (members == null) {
			return Optional.empty();
		}
		Member removed = members.remove(userId);
		if (removed == null) {
			return Optional.empty();
		}
		if (members.isEmpty()) {
			membersBySession.remove(sessionId);
		}
		removeKeyFromConnection(removed.connectionId, new VoiceKey(sessionId, userId));
		return Optional.of(removed);
	}

	private void removeKeyFromConnection(String connectionId, VoiceKey key) {
		Set<VoiceKey> keys = keysByConnection.get(connectionId);
		if (keys == null) {
			return;
		}
		keys.remove(key);
		if (keys.isEmpty()) {
			keysByConnection.remove(connectionId);
		}
	}

	public record JoinResult(
			VoiceParticipantResponse participant,
			List<VoiceParticipantResponse> participants) {
	}

	public record Departure(
			Long sessionId,
			VoiceParticipantResponse participant,
			List<VoiceParticipantResponse> participants) {
	}

	private record VoiceKey(Long sessionId, Long userId) {
	}

	private static class Member {

		private final SessionParticipantResponse participant;
		private final String connectionId;
		private boolean micMuted;
		private boolean deafened;

		private Member(SessionParticipantResponse participant, String connectionId) {
			this.participant = participant;
			this.connectionId = connectionId;
		}

		private VoiceParticipantResponse toResponse() {
			return new VoiceParticipantResponse(
					participant.userId(),
					participant.name(),
					participant.role(),
					micMuted,
					deafened);
		}
	}
}
