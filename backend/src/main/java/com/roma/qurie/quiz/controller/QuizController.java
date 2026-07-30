package com.roma.qurie.quiz.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.service.QuizService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

	private final QuizService quizService;

	/**
	 * 퀴즈 생성 요청. AI 서버에 접수만 하고 202 로 돌아온다 —
	 * 실제 문항은 GET /api/quiz/{quizSetId} 폴링으로 받아 간다.
	 *
	 * @param projectId: 퀴즈 생성에 기반이 되는 project id
	 * @param request: 퀴즈 생성을 위한 DTO. 출제 대상 코드는 files(경로→내용)에 직접 담는다
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	public QuizGenerateResponse generateQuiz(@RequestParam("project") Long projectId,
			@Valid @RequestBody QuizGenerateRequest request) {
		return quizService.requestQuizGeneration(projectId, request);
	}

	/**
	 * 퀴즈셋 상태/결과 조회. 생성 중이면 AI 서버 상태를 확인해 완료 시 문항까지 저장해서 내려준다.
	 */
	@GetMapping("/{quizSetId}")
	public QuizSetDetailResponse getQuizSet(@PathVariable("quizSetId") Long quizSetId) {
		return quizService.getQuizSet(quizSetId);
	}
}
