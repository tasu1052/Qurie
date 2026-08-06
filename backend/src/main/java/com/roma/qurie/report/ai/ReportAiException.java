package com.roma.qurie.report.ai;

/** AI 리포트 서버 호출 실패(연결 불가·타임아웃·비정상 응답). 호출부가 AI 항목 없는 발급으로 흡수한다. */
public class ReportAiException extends RuntimeException {

	public ReportAiException(String message, Throwable cause) {
		super(message, cause);
	}
}
