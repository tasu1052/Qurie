package com.roma.qurie.quiz.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.repository.QuizSetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizService {

	private final QuizSetRepository quizSetRepository;

	@Transactional
	public QuizGenerateResponse requestQuizGeneration(Long projectId, QuizGenerateRequest request) {
		QuizSet quizSet = QuizSet.builder()
				.projectId(projectId)
				.snapshotId(request.snapshotId())
				.mode(request.mode())
				.requestedCount(request.count())
				.requestedTypes(request.types())
				.ratioEasy(request.ratioEasy())
				.ratioNormal(request.ratioNormal())
				.ratioHard(request.ratioHard())
				.userPrompt(request.userPrompt())
				.createdBy(request.createdBy())
				.build();

		return QuizGenerateResponse.from(quizSetRepository.save(quizSet));
	}
}
