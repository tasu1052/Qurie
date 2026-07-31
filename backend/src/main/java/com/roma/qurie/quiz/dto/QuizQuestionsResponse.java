package com.roma.qurie.quiz.dto;

import java.util.List;

import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;

/**
 * 학생 응시용 문항 응답. 정답(answer)·해설(explanation)·정답 텍스트를 절대 포함하지 않는다 —
 * 프론트에서 가리는 것으로는 부족하다(개발자 도구로 응답 원문이 보인다).
 * 정답이 필요한 출제자 화면은 QuizSetDetailResponse 를 쓴다.
 */
public record QuizQuestionsResponse(
		Long quizSetId,
		QuizSetStatus status,
		String generationStage,
		int requestedCount,
		List<QuestionItem> quizzes) {

	public static QuizQuestionsResponse from(QuizSet quizSet, String generationStage) {
		return new QuizQuestionsResponse(
				quizSet.getId(),
				quizSet.getStatus(),
				generationStage,
				quizSet.getRequestedCount(),
				quizSet.getQuizzes().stream().map(QuestionItem::from).toList());
	}

	public record QuestionItem(
			Long id,
			QuizType type,
			QuizDifficulty difficulty,
			String testedConcept,
			String question,
			String filePath,
			Integer lineStart,
			Integer lineEnd,
			int timeLimitSec,
			int orderNo,
			List<ChoiceItem> choices) {

		public static QuestionItem from(Quiz quiz) {
			return new QuestionItem(
					quiz.getId(),
					quiz.getType(),
					quiz.getDifficulty(),
					quiz.getTestedConcept(),
					quiz.getQuestion(),
					quiz.getFilePath(),
					quiz.getLineStart(),
					quiz.getLineEnd(),
					quiz.getTimeLimitSec(),
					quiz.getOrderNo(),
					quiz.getChoices().stream().map(ChoiceItem::from).toList());
		}
	}

	/** 보기. isAnswer 를 담지 않는 것이 이 DTO 의 존재 이유다. */
	public record ChoiceItem(int idx, String content) {

		public static ChoiceItem from(QuizChoice choice) {
			return new ChoiceItem(choice.getIdx(), choice.getContent());
		}
	}
}
