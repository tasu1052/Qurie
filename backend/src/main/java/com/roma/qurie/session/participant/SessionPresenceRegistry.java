package com.roma.qurie.session.participant;

import com.roma.qurie.session.participant.dto.SessionParticipantResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SessionPresenceRegistry {

	private final Map<Long, Map<Long, Presence>> presencesBySession = new HashMap<>();
	private final Map<String, Set<PresenceKey>> presenceKeysByConnection = new HashMap<>();

	public synchronized JoinResult enter(
			Long sessionId,
			String connectionId,
			SessionParticipantResponse participant) {
		Map<Long, Presence> sessionPresences =
				presencesBySession.computeIfAbsent(sessionId, key -> new HashMap<>());
		Presence presence = sessionPresences.computeIfAbsent(
				participant.userId(),
				key -> new Presence(participant));
		boolean firstConnection = presence.connectionIds.isEmpty();
		boolean connectionAdded = presence.connectionIds.add(connectionId);
		if (connectionAdded) {
			presenceKeysByConnection
					.computeIfAbsent(connectionId, key -> new HashSet<>())
					.add(new PresenceKey(sessionId, participant.userId()));
		}

		return new JoinResult(firstConnection && connectionAdded, participants(sessionId));
	}

	public synchronized Optional<Departure> leave(
			Long sessionId,
			String connectionId,
			Long userId) {
		removePresenceKeyFromConnection(connectionId, new PresenceKey(sessionId, userId));
		return removeConnectionFromPresence(sessionId, connectionId, userId);
	}

	public synchronized List<Departure> disconnect(String connectionId) {
		Set<PresenceKey> presenceKeys = presenceKeysByConnection.remove(connectionId);
		if (presenceKeys == null) {
			return List.of();
		}

		List<Departure> departures = new ArrayList<>();
		for (PresenceKey presenceKey : presenceKeys) {
			removeConnectionFromPresence(
					presenceKey.sessionId(),
					connectionId,
					presenceKey.userId())
					.ifPresent(departures::add);
		}
		return List.copyOf(departures);
	}

	public synchronized boolean isPresent(
			Long sessionId,
			String connectionId,
			Long userId) {
		Map<Long, Presence> sessionPresences = presencesBySession.get(sessionId);
		if (sessionPresences == null) {
			return false;
		}
		Presence presence = sessionPresences.get(userId);
		return presence != null && presence.connectionIds.contains(connectionId);
	}

	public synchronized List<SessionParticipantResponse> participants(Long sessionId) {
		Map<Long, Presence> sessionPresences = presencesBySession.get(sessionId);
		if (sessionPresences == null) {
			return List.of();
		}
		return sessionPresences.values().stream()
				.map(presence -> presence.participant)
				.sorted(Comparator.comparing(SessionParticipantResponse::userId))
				.toList();
	}

	private Optional<Departure> removeConnectionFromPresence(
			Long sessionId,
			String connectionId,
			Long userId) {
		Map<Long, Presence> sessionPresences = presencesBySession.get(sessionId);
		if (sessionPresences == null) {
			return Optional.empty();
		}
		Presence presence = sessionPresences.get(userId);
		if (presence == null || !presence.connectionIds.remove(connectionId)) {
			return Optional.empty();
		}
		if (!presence.connectionIds.isEmpty()) {
			return Optional.empty();
		}

		sessionPresences.remove(userId);
		if (sessionPresences.isEmpty()) {
			presencesBySession.remove(sessionId);
		}
		return Optional.of(new Departure(
				sessionId,
				presence.participant,
				participants(sessionId)));
	}

	private void removePresenceKeyFromConnection(
			String connectionId,
			PresenceKey presenceKey) {
		Set<PresenceKey> presenceKeys = presenceKeysByConnection.get(connectionId);
		if (presenceKeys == null) {
			return;
		}
		presenceKeys.remove(presenceKey);
		if (presenceKeys.isEmpty()) {
			presenceKeysByConnection.remove(connectionId);
		}
	}

	public record JoinResult(
			boolean firstConnection,
			List<SessionParticipantResponse> participants) {
	}

	public record Departure(
			Long sessionId,
			SessionParticipantResponse participant,
			List<SessionParticipantResponse> participants) {
	}

	private record PresenceKey(Long sessionId, Long userId) {
	}

	private static class Presence {

		private final SessionParticipantResponse participant;
		private final Set<String> connectionIds = new HashSet<>();

		private Presence(SessionParticipantResponse participant) {
			this.participant = participant;
		}
	}
}
