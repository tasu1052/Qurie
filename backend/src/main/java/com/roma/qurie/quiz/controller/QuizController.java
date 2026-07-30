package com.roma.qurie.quiz.controller;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.quiz.ai.AiQuizStatusResponse;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.service.QuizService;
import com.roma.qurie.security.AuthUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

	private final QuizService quizService;

	/** 비어있으면 콜백 인증을 검사하지 않는다 — 로컬 개발 편의용, 배포 값은 반드시 채운다. */
	@Value("${app.ai.callback-secret:}")
	private String callbackSecret;

	/**
	 * 퀴즈 생성 요청. AI 서버에 접수만 하고 202 로 돌아온다 —
	 * 실제 문항은 AI 의 완료 콜백으로 채워지고, 세션 참여자에게는 웹소켓으로 알려준다.
	 *
	 * @param projectId: 퀴즈 생성에 기반이 되는 project id
	 * @param request: 퀴즈 생성을 위한 DTO. 출제 대상 코드는 files(경로→내용)에 직접 담는다
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	public QuizGenerateResponse generateQuiz(@RequestParam("project") Long projectId,
			@Valid @RequestBody QuizGenerateRequest request,
			@AuthenticationPrincipal AuthUser requester) {
		return quizService.requestQuizGeneration(projectId, request, requester.id());
	}

	/**
	 * 퀴즈셋 상태/결과 조회. 생성 중이면 AI 서버 상태를 확인해 완료 시 문항까지 저장해서 내려준다.
	 * 콜백이 정상 도착했다면 이미 끝난 상태를 그대로 반환한다.
	 */
	@GetMapping("/{quizSetId}")
	public QuizSetDetailResponse getQuizSet(@PathVariable("quizSetId") Long quizSetId) {
		return quizService.getQuizSet(quizSetId);
	}

	/**
	 * AI 서버의 생성 완료 콜백. 인증이 없는 서버 간 호출이라 공유 비밀 헤더로만 최소한을 걸러낸다.
	 */
	@PostMapping("/{quizSetId}/callback")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void receiveCallback(@PathVariable("quizSetId") Long quizSetId,
			@RequestBody AiQuizStatusResponse payload,
			@RequestHeader(value = "X-Ai-Callback-Secret", required = false) String secret) {
		if (!callbackSecret.isBlank() && !callbackSecret.equals(secret)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "콜백 인증에 실패했습니다.");
		}
		quizService.handleCallback(quizSetId, payload);
	}
}
