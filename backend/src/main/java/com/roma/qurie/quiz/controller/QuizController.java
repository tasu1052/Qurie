package com.roma.qurie.quiz.controller;

import jakarta.validation.Valid;

import java.util.List;

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
import com.roma.qurie.quiz.dto.QuizQuestionsResponse;
import com.roma.qurie.quiz.dto.QuizSatisfactionRequest;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.dto.QuizSetSummaryResponse;
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
		return quizService.requestQuizGeneration(projectId, request, requester);
	}

	/**
	 * 프로젝트의 퀴즈셋 목록(최신순). 새로고침·재입장 시 생성 중/완료 퀴즈를 복원할 때 쓴다.
	 */
	@GetMapping(params = "project")
	public List<QuizSetSummaryResponse> listByProject(
			@RequestParam("project") Long projectId,
			@AuthenticationPrincipal AuthUser requester) {
		return quizService.listByProject(projectId, requester);
	}

	/**
	 * 퀴즈셋 상태/결과 조회 — 정답·해설이 포함되므로 강사(MANAGER/MASTER) 전용.
	 * 생성 중이면 AI 서버 상태를 확인해 완료 시 문항까지 저장해서 내려준다.
	 */
	@GetMapping("/{quizSetId}")
	public QuizSetDetailResponse getQuizSet(@PathVariable("quizSetId") Long quizSetId,
			@AuthenticationPrincipal AuthUser requester) {
		return quizService.getQuizSet(quizSetId, requester);
	}

	/**
	 * 학생 응시용 문항 조회 — 정답·해설 없이 문항과 보기만 내려간다. 세션이 열린 반의 구성원 전용.
	 */
	@GetMapping("/{quizSetId}/questions")
	public QuizQuestionsResponse getQuizQuestions(@PathVariable("quizSetId") Long quizSetId,
			@AuthenticationPrincipal AuthUser requester) {
		return quizService.getQuizQuestions(quizSetId, requester);
	}

	/** 퀴즈 생성 완료 후 만족도(1–5). */
	@PostMapping("/{quizSetId}/satisfaction")
	public QuizSetSummaryResponse submitSatisfaction(
			@PathVariable("quizSetId") Long quizSetId,
			@Valid @RequestBody QuizSatisfactionRequest request,
			@AuthenticationPrincipal AuthUser requester) {
		return quizService.submitSatisfaction(quizSetId, request, requester);
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
