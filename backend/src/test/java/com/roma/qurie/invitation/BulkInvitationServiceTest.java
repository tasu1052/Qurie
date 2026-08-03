package com.roma.qurie.invitation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.roma.qurie.invitation.dto.BulkInvitationResponse;
import com.roma.qurie.invitation.dto.InvitationCreateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.UserRole;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class BulkInvitationServiceTest {

	private static final Long CLASS_ID = 3L;
	private static final AuthUser MANAGER =
			new AuthUser(10L, "MANAGER", 100L, "manager@qurie.com", "매니저", CLASS_ID);

	@Spy
	private InvitationFileReader fileReader = new InvitationFileReader();

	@Mock
	private InvitationService invitationService;

	@InjectMocks
	private BulkInvitationService bulkInvitationService;

	@Test
	void invitesEveryEmailInFile() {
		String csv = "이메일\nstudent1@qurie.com\nstudent2@qurie.com\n";

		BulkInvitationResponse response = invite(csv);

		assertThat(response.total()).isEqualTo(2);
		assertThat(response.invited()).isEqualTo(2);
		assertThat(response.failed()).isZero();
		verify(invitationService, times(2)).create(eq(MANAGER), any(InvitationCreateRequest.class));
	}

	/** 한 행이 실패해도 나머지는 발송되어야 한다 — 50명 중 1명 때문에 전체를 되돌리면 재시도할 방법이 없다. */
	@Test
	void keepsGoingWhenOneRowFails() {
		// 특정 인자에만 스텁을 걸면 나머지 호출이 strict stubs 에 걸려 예외가 된다 — 먼저 일반 스텁을 깔고 덮어쓴다.
		given(invitationService.create(any(AuthUser.class), any(InvitationCreateRequest.class))).willReturn(null);
		willThrow(new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."))
				.given(invitationService)
				.create(eq(MANAGER), eq(new InvitationCreateRequest("taken@qurie.com", CLASS_ID, UserRole.STUDENT)));

		BulkInvitationResponse response = invite("ok@qurie.com\ntaken@qurie.com\nok2@qurie.com\n");

		assertThat(response.total()).isEqualTo(3);
		assertThat(response.invited()).isEqualTo(2);
		assertThat(response.failed()).isEqualTo(1);
		assertThat(response.results())
				.filteredOn(result -> !result.invited())
				.singleElement()
				.satisfies(result -> {
					assertThat(result.email()).isEqualTo("taken@qurie.com");
					assertThat(result.message()).isEqualTo("이미 가입된 이메일입니다.");
					assertThat(result.rowNumber()).isEqualTo(2);
				});
	}

	@Test
	void reportsMalformedEmailWithoutCallingInvitationService() {
		BulkInvitationResponse response = invite("not-an-email@\nok@qurie.com\n");

		assertThat(response.failed()).isEqualTo(1);
		assertThat(response.results().get(0).message()).isEqualTo("이메일 형식이 올바르지 않습니다.");
		verify(invitationService, times(1)).create(eq(MANAGER), any(InvitationCreateRequest.class));
	}

	@Test
	void reportsDuplicateEmailInsideFileOnce() {
		BulkInvitationResponse response = invite("dup@qurie.com\nDUP@qurie.com\n");

		assertThat(response.invited()).isEqualTo(1);
		assertThat(response.failed()).isEqualTo(1);
		assertThat(response.results().get(1).message()).isEqualTo("파일 안에 중복된 이메일입니다.");
		verify(invitationService, times(1)).create(eq(MANAGER), any(InvitationCreateRequest.class));
	}

	/**
	 * create 의 반환값은 쓰지 않으므로 스텁하지 않는다 —
	 * 여기서 any() 로 스텁하면 개별 테스트가 걸어둔 예외 스텁을 덮어써 실패 케이스가 성공으로 바뀐다.
	 */
	private BulkInvitationResponse invite(String csv) {
		return bulkInvitationService.inviteFromFile(
				MANAGER, CLASS_ID, UserRole.STUDENT, "members.csv", csv.getBytes(StandardCharsets.UTF_8));
	}
}
