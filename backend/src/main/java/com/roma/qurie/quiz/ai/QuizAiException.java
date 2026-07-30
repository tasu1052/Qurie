package com.roma.qurie.quiz.ai;

/** AI 서버 호출 실패(연결 불가·타임아웃·비정상 응답). 호출부가 QuizSet 상태로 흡수한다. */
public class QuizAiException extends RuntimeException {

	public QuizAiException(String message, Throwable cause) {
		super(message, cause);
	}
}
