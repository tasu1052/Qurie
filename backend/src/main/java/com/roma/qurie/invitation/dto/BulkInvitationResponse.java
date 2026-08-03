package com.roma.qurie.invitation.dto;

import java.util.List;

/**
 * 초대 일괄 발송 결과. 한 행이 실패해도 나머지는 발송되므로 행별 결과를 그대로 돌려준다 —
 * 화면이 "3건 실패, 12행 이미 가입된 이메일" 처럼 보여줄 수 있어야 재시도할 파일을 만들 수 있다.
 */
public record BulkInvitationResponse(
		int total,
		int invited,
		int failed,
		List<RowResult> results) {

	public static BulkInvitationResponse of(List<RowResult> results) {
		int invited = (int)results.stream().filter(RowResult::invited).count();
		return new BulkInvitationResponse(results.size(), invited, results.size() - invited, results);
	}

	/** rowNumber 는 파일에서의 줄 번호(1부터)다. message 는 실패 사유이고 성공이면 null 이다. */
	public record RowResult(int rowNumber, String email, boolean invited, String message) {

		public static RowResult success(int rowNumber, String email) {
			return new RowResult(rowNumber, email, true, null);
		}

		public static RowResult failure(int rowNumber, String email, String message) {
			return new RowResult(rowNumber, email, false, message);
		}
	}
}
