package com.roma.qurie.invitation;

import com.roma.qurie.invitation.dto.BulkInvitationResponse;
import com.roma.qurie.invitation.dto.BulkInvitationResponse.RowResult;
import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.UserRole;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * 엑셀·CSV 파일의 이메일로 초대를 한 번에 발송한다. 사람이 수십 명을 한 명씩 입력하는 것을 대신하는 기능이다.
 *
 * 행마다 InvitationService.create 를 그대로 호출한다 — 권한 규칙(마스터는 매니저만, 매니저는 자기 반 학생만),
 * 중복 가입 검사, 메일 발송이 단건 초대와 완전히 같아야 하고 검증 로직을 두 벌 두면 반드시 어긋난다.
 *
 * 일부러 @Transactional 을 걸지 않는다. create 가 각자 트랜잭션을 가지므로 한 행이 실패해도 앞선 행은 남는다 —
 * 50명 중 1명이 이미 가입돼 있다고 49명의 초대를 되돌리면 사용자는 실패한 한 명을 찾을 방법이 없다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkInvitationService {

	private static final Pattern EMAIL_PATTERN =
			Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

	private final InvitationFileReader fileReader;
	private final InvitationService invitationService;

	public BulkInvitationResponse inviteFromFile(
			AuthUser inviter,
			Long classId,
			UserRole role,
			String fileName,
			byte[] content) {
		List<InvitationFileReader.EmailRow> rows = fileReader.read(fileName, content);

		List<RowResult> results = new ArrayList<>();
		Set<String> seen = new HashSet<>();
		for (InvitationFileReader.EmailRow row : rows) {
			String email = row.email().trim();
			if (!EMAIL_PATTERN.matcher(email).matches()) {
				results.add(RowResult.failure(row.rowNumber(), email, "이메일 형식이 올바르지 않습니다."));
				continue;
			}
			if (!seen.add(email.toLowerCase(Locale.ROOT))) {
				results.add(RowResult.failure(row.rowNumber(), email, "파일 안에 중복된 이메일입니다."));
				continue;
			}
			results.add(invite(inviter, classId, role, row.rowNumber(), email));
		}
		return BulkInvitationResponse.of(results);
	}

	private RowResult invite(AuthUser inviter, Long classId, UserRole role, int rowNumber, String email) {
		try {
			invitationService.create(inviter, new InvitationCreateRequest(email, classId, role));
			return RowResult.success(rowNumber, email);
		} catch (ResponseStatusException e) {
			// 권한 없음(403)·클래스 없음(404) 처럼 파일과 무관한 실패도 같은 형태로 담는다.
			// 첫 행에서 403 이 나면 이후 행도 전부 같은 이유로 실패하므로 결과만 봐도 원인이 드러난다.
			return RowResult.failure(rowNumber, email, e.getReason());
		} catch (RuntimeException e) {
			log.error("초대 일괄 발송 중 예기치 못한 실패. row={}, email={}", rowNumber, email, e);
			return RowResult.failure(rowNumber, email, "초대 생성에 실패했습니다.");
		}
	}
}
