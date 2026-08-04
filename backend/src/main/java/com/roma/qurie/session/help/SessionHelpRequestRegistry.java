package com.roma.qurie.session.help;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/**
 * 세션 "질문하기" 요청을 메모리에 보관한다. 시연용 알림 — 재시작 시 비운다.
 */
@Component
public class SessionHelpRequestRegistry {

	private final AtomicLong seq = new AtomicLong(1);
	private final Map<Long, HelpRequest> byId = new ConcurrentHashMap<>();

	public HelpRequest create(long sessionId, long classId, long fromUserId, String fromName, String sessionTitle) {
		long id = seq.getAndIncrement();
		HelpRequest req = new HelpRequest(id, sessionId, classId, fromUserId, fromName, sessionTitle, Instant.now());
		byId.put(id, req);
		return req;
	}

	public List<HelpRequest> listByClassId(long classId) {
		List<HelpRequest> list = new ArrayList<>();
		for (HelpRequest req : byId.values()) {
			if (req.classId() == classId) {
				list.add(req);
			}
		}
		list.sort(Comparator.comparing(HelpRequest::createdAt).reversed());
		return list;
	}

	public void dismiss(long id) {
		byId.remove(id);
	}

	public record HelpRequest(
			long id,
			long sessionId,
			long classId,
			long fromUserId,
			String fromName,
			String sessionTitle,
			Instant createdAt) {
	}
}
