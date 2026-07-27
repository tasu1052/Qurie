package com.roma.qurie.quiz.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.service.QuizService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {

	private final QuizService quizService;

	/**
	 *
	 * todo: 퀴즈 set 생성하고 실제 퀴즈(ai 생성)는 나중에 비동기로 응답하게 설계
	 * 		 이 부분 나중에 확인 필요
	 * @param projectId: 퀴즈 생성에 기반이 되는 project id
	 * @param request: 퀴즈 생성을 위한 DTO
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	public QuizGenerateResponse generateQuiz(@RequestParam("project") Long projectId,
			@Valid @RequestBody QuizGenerateRequest request) {
		return quizService.requestQuizGeneration(projectId, request);
	}
}
