package com.roma.qurie.report.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizRepository;
import com.roma.qurie.report.ai.AiReportAttempt;
import com.roma.qurie.report.ai.AiReportCreateRequest;
import com.roma.qurie.report.ai.AiReportResponse;
import com.roma.qurie.report.ai.AiReportSummary;
import com.roma.qurie.report.ai.ReportAiClient;
import com.roma.qurie.report.ai.ReportAiException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 리포트의 AI 정성 항목(총평·강점·보완점) 생성을 맡는다. 문항·응시 기록을 AI 요청 모양으로
 * 조립하고, 응답 bullet 을 저장 컬럼(List&lt;String&gt;) 문장으로 바꾼다.
 *
 * AI 는 부가 정보다 — 생성 실패·스킵이 리포트 발급 자체를 막지 않도록 null 로 흡수한다.
 * AI 호출(수 초)이 DB 커넥션을 점유하지 않도록 데이터 조립(읽기)만 트랜잭션으로 묶는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportAiFeedbackService {

	/** AI 요청 스키마의 attempts 상한. 넘치면 오래된 쪽을 버린다 — 최신 학습 상태가 더 중요하다. */
	private static final int MAX_ATTEMPTS = 50;
	/** AI 쪽 student_name 제약(max_length=50)에 맞춘다. */
	private static final int MAX_STUDENT_NAME_LENGTH = 50;

	private final ReportAiClient reportAiClient;
	private final QuizRepository quizRepository;
	private final QuizProgressRepository quizProgressRepository;
	private final TransactionTemplate transactionTemplate;

	/** 저장 컬럼 모양으로 변환을 끝낸 AI 피드백. */
	public record AiFeedback(String comment, List<String> strengths, List<String> improvements) {
	}

	/**
	 * 퀴즈셋들의 응시 기록으로 AI 피드백을 생성한다. 실패·스킵이면 null 을 반환하고
	 * 호출부는 AI 항목 없이 발급을 계속한다.
	 *
	 * @param sessionId 세션 리포트면 세션 id, 유저(최종) 리포트면 null
	 * @param quizSetIds 응시 기록을 모을 퀴즈셋들 — 세션 리포트는 1개, 유저 리포트는 반 전체
	 */
	public AiFeedback generate(String studentName, Long sessionId, Long userId, List<Long> quizSetIds,
			AiReportSummary summary) {
		List<AiReportAttempt> attempts;
		try {
			attempts = transactionTemplate.execute(status -> buildAttempts(userId, quizSetIds));
		} catch (RuntimeException e) {
			// choices fetch 중복·지연로딩 등 조립 실패가 발급 전체를 500 으로 만들지 않도록 흡수한다.
			log.warn("AI 응시 기록 조립 실패 — AI 항목 없이 발급을 계속한다. {}", e.toString());
			return null;
		}
		if (attempts == null || attempts.stream().allMatch(attempt -> attempt.chosenIndex() == null)) {
			// 응시한 문항이 하나도 없으면 AI 서버도 스킵 응답만 준다. 왕복을 아낀다.
			return null;
		}
		try {
			AiReportResponse response = reportAiClient.createReport(new AiReportCreateRequest(
					truncateName(studentName),
					sessionId,
					quizSetIds.size() == 1 ? quizSetIds.get(0) : null,
					summary,
					attempts));
			return toFeedback(response);
		} catch (ReportAiException e) {
			log.warn("AI 리포트 피드백 생성 실패 — AI 항목 없이 발급을 계속한다. {}", e.getMessage());
			return null;
		}
	}

	private List<AiReportAttempt> buildAttempts(Long userId, List<Long> quizSetIds) {
		List<AttemptSource> sources = new ArrayList<>();
		for (Long quizSetId : quizSetIds) {
			sources.addAll(collectQuizSetSources(quizSetId, userId));
		}
		if (sources.size() > MAX_ATTEMPTS) {
			sources = sources.subList(sources.size() - MAX_ATTEMPTS, sources.size());
		}

		List<AiReportAttempt> attempts = new ArrayList<>(sources.size());
		for (int i = 0; i < sources.size(); i++) {
			attempts.add(toAttempt(i + 1, sources.get(i)));
		}
		return attempts;
	}

	private List<AttemptSource> collectQuizSetSources(Long quizSetId, Long userId) {
		List<Quiz> quizzes = quizRepository.findAllWithChoicesByQuizSetId(quizSetId);
		if (quizzes.isEmpty()) {
			return List.of();
		}
		Map<Long, QuizProgress> myProgressByQuizId =
				quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(quizSetId, userId).stream()
						.collect(Collectors.toMap(
								progress -> progress.getQuiz().getId(),
								Function.identity(),
								(first, ignored) -> first));
		Map<Long, List<QuizProgress>> cohortByQuizId =
				quizProgressRepository.findAllWithQuizByQuizSetId(quizSetId).stream()
						.collect(Collectors.groupingBy(progress -> progress.getQuiz().getId()));

		List<AttemptSource> sources = new ArrayList<>(quizzes.size());
		for (Quiz quiz : quizzes) {
			sources.add(new AttemptSource(
					quiz,
					myProgressByQuizId.get(quiz.getId()),
					cohortByQuizId.getOrDefault(quiz.getId(), List.of())));
		}
		return sources;
	}

	private AiReportAttempt toAttempt(int index, AttemptSource source) {
		Quiz quiz = source.quiz();
		QuizProgress progress = source.progress();
		List<QuizChoice> choices = sortedChoices(quiz);

		return new AiReportAttempt(
				index,
				quiz.getQuestion(),
				choices.stream().map(QuizChoice::getContent).toList(),
				indexOfAnswer(choices),
				progress == null ? null : indexOfChosen(choices, progress),
				progress == null ? null : progress.getIsCorrect(),
				quiz.getExplanation(),
				quiz.getTestedConcept(),
				quiz.getDifficulty().name(),
				quiz.getPurpose().name(),
				quiz.getFilePath(),
				quiz.getLineStart(),
				quiz.getLineEnd(),
				progress == null ? 0 : (int) Math.min(progress.getElapsedMs(), Integer.MAX_VALUE),
				toCohort(choices, source.cohortProgresses()));
	}

	private static List<QuizChoice> sortedChoices(Quiz quiz) {
		return quiz.getChoices().stream()
				.sorted(Comparator.comparingInt(QuizChoice::getIdx))
				.toList();
	}

	/** 보기 인덱스는 idx 컬럼 값이 아니라 정렬된 choices 목록에서의 위치다 — AI 는 목록 위치로 대조한다. */
	private static int indexOfAnswer(List<QuizChoice> choices) {
		for (int i = 0; i < choices.size(); i++) {
			if (choices.get(i).isAnswer()) {
				return i;
			}
		}
		return 0;
	}

	private static Integer indexOfChosen(List<QuizChoice> choices, QuizProgress progress) {
		QuizChoice chosen = progress.getChosenChoice();
		if (chosen == null) {
			return null;
		}
		for (int i = 0; i < choices.size(); i++) {
			if (choices.get(i).getId().equals(chosen.getId())) {
				return i;
			}
		}
		return null;
	}

	/** 반 전체 문항 집계. 응시자가 없으면 보내지 않는다 — 신뢰 최소 인원 판정은 AI 쪽 검증이 맡는다. */
	private static AiReportAttempt.AiReportCohort toCohort(
			List<QuizChoice> choices, List<QuizProgress> cohortProgresses) {
		List<QuizProgress> attempted = cohortProgresses.stream()
				.filter(progress -> progress.getChosenChoice() != null)
				.toList();
		if (attempted.isEmpty()) {
			return null;
		}
		int correct = (int) attempted.stream()
				.filter(progress -> Boolean.TRUE.equals(progress.getIsCorrect()))
				.count();
		List<Integer> distribution = new ArrayList<>(choices.size());
		for (QuizChoice choice : choices) {
			distribution.add((int) attempted.stream()
					.filter(progress -> choice.getId().equals(progress.getChosenChoice().getId()))
					.count());
		}
		return new AiReportAttempt.AiReportCohort(attempted.size(), correct, distribution);
	}

	private AiFeedback toFeedback(AiReportResponse response) {
		if (response == null) {
			return null;
		}
		if (response.skippedReason() != null && !response.skippedReason().isBlank()) {
			log.info("AI 리포트 생성 스킵: {}", response.skippedReason());
			return null;
		}
		String comment = response.comment() == null ? "" : response.comment().trim();
		List<String> strengths = formatBullets(response.strengths());
		List<String> improvements = formatBullets(response.improvements());
		if (comment.isEmpty() && strengths.isEmpty() && improvements.isEmpty()) {
			return null;
		}
		return new AiFeedback(comment.isEmpty() ? null : comment, strengths, improvements);
	}

	private static List<String> formatBullets(List<AiReportResponse.AiReportBullet> bullets) {
		if (bullets == null) {
			return List.of();
		}
		return bullets.stream()
				.filter(bullet -> bullet.text() != null && !bullet.text().isBlank())
				.map(ReportAiFeedbackService::formatBullet)
				.toList();
	}

	/**
	 * bullet 을 화면·PDF 가 그대로 쓰는 문장(List&lt;String&gt; 컬럼)으로 바꾼다. 문항 번호와 반 정답률은
	 * AI 문장이 아니라 구조화 필드에서 붙인다 — AI 가 문장에 직접 쓰면 번호·수치를 틀린다.
	 */
	private static String formatBullet(AiReportResponse.AiReportBullet bullet) {
		StringBuilder line = new StringBuilder();
		if (bullet.quizIndex() != null) {
			line.append(bullet.quizIndex()).append("번 문항: ");
		}
		line.append(bullet.text().trim());
		if (bullet.cohortRate() != null) {
			line.append(" (반 정답률 ").append(Math.round(bullet.cohortRate())).append("%)");
		}
		return line.toString();
	}

	private static String truncateName(String name) {
		if (name == null || name.isBlank()) {
			return "학생";
		}
		return name.length() <= MAX_STUDENT_NAME_LENGTH ? name : name.substring(0, MAX_STUDENT_NAME_LENGTH);
	}

	private record AttemptSource(Quiz quiz, QuizProgress progress, List<QuizProgress> cohortProgresses) {
	}
}
