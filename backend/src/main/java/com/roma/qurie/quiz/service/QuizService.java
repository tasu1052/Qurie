package com.roma.qurie.quiz.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.ai.AiQuizCreateRequest;
import com.roma.qurie.quiz.ai.AiQuizSetAccepted;
import com.roma.qurie.quiz.ai.AiQuizStatusResponse;
import com.roma.qurie.quiz.ai.QuizAiClient;
import com.roma.qurie.quiz.ai.QuizAiException;
import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.dto.QuizGenerateResponse;
import com.roma.qurie.quiz.dto.QuizGenerationNotification;
import com.roma.qurie.quiz.dto.QuizQuestionsResponse;
import com.roma.qurie.quiz.dto.QuizSatisfactionRequest;
import com.roma.qurie.quiz.dto.QuizSetDetailResponse;
import com.roma.qurie.quiz.dto.QuizSetSummaryResponse;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizPurpose;
import com.roma.qurie.quiz.entity.QuizSatisfaction;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.entity.QuizType;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizRepository;
import com.roma.qurie.quiz.repository.QuizSatisfactionRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

	/** todo: 문항 제한 시간 정책이 정해지면 요청/난이도별 값으로 교체. */
	private static final int DEFAULT_TIME_LIMIT_SEC = 60;
	/** 재생성 시 AI 에 넘기는 '이전 문항' 한 건의 최대 길이. 프롬프트 폭주 방지용 상한이다. */
	private static final int AVOID_QUESTION_MAX_CHARS = 200;
	/** 재생성 시 AI 에 넘기는 '이전 문항' 목록 상한. 최신 세트부터 채운다. */
	private static final int AVOID_QUESTIONS_LIMIT = 40;
	private static final String MANAGER_ROLE = "MANAGER";
	private static final String MASTER_ROLE = "MASTER";

	private final QuizSetRepository quizSetRepository;
	private final QuizRepository quizRepository;
	private final QuizProgressRepository quizProgressRepository;
	private final QuizSatisfactionRepository quizSatisfactionRepository;
	private final ProjectRepository projectRepository;
	private final QuizAiClient quizAiClient;
	private final SimpMessagingTemplate messagingTemplate;
	private final SessionParticipantService participantService;
	private final TransactionTemplate transactionTemplate;

	/** AI 서버가 생성 완료를 알려올 콜백 주소의 베이스 — 배포 시 백엔드 자신의 외부 접근 주소로 바뀐다. */
	@Value("${app.ai.callback-base-url}")
	private String callbackBaseUrl;

	/**
	 * 퀴즈 생성 요청. 접수 기록(QuizSet)을 먼저 남기고 AI 서버에 생성을 넘긴다 —
	 * AI 가 죽어 있어도 요청 이력이 FAILED 로 남아 사용자가 재시도 여부를 판단할 수 있다.
	 *
	 * 같은 sourcePath(파일/폴더)로 다시 출제하면 그 스코프의 퀴즈셋·응시만 지우고 대체한다.
	 * 다른 파일로 출제하면 기존 셋을 유지한 채 새 퀴즈셋을 추가한다. 세션 리포트는 완료된
	 * 모든 셋을 합산한다. 이미 발급된 세션 리포트 스냅샷은 영향받지 않는다.
	 *
	 * 메서드에 @Transactional 을 걸지 않는 것은 의도다. AI 호출(최대 수 초)이 트랜잭션 안에 들어가면
	 * 그 시간만큼 DB 커넥션을 점유하므로, 삭제+새 접수 저장만 TransactionTemplate 로 묶는다.
	 */
	public QuizGenerateResponse requestQuizGeneration(
			Long projectId, QuizGenerateRequest request, AuthUser requester) {
		requireAuthenticated(requester);
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다: " + projectId));
		verifyCanGenerate(project.getSessionId(), requester);

		String sourcePath = resolveSourcePath(request);
		String sourceKind = resolveSourceKind(request, sourcePath);

		if (quizSetRepository.existsByProjectIdAndSourcePathAndStatusIn(
				projectId, sourcePath, List.of(QuizSetStatus.QUEUED, QuizSetStatus.GENERATING))) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT, "이미 생성 중인 퀴즈가 있습니다. 완료될 때까지 기다려 주세요.");
		}

		// 삭제 전에 이전 문항을 모아 AI 에 '중복 출제 금지' 목록으로 넘긴다. 트랜잭션 안에서
		// 읽어야 lazy 문항 컬렉션 접근이 안전하고, 삭제 대상 조회와 같은 결과를 본다.
		List<String> avoidQuestions = new ArrayList<>();
		QuizSet quizSet = transactionTemplate.execute(status -> {
			List<QuizSet> previousSets = quizSetRepository.findByProjectIdOrderByIdDesc(projectId);
			boolean replacing = previousSets.stream()
					.anyMatch(set -> Objects.equals(sourcePath, set.getSourcePath()));
			// 같은 스코프 재생성: 그 셋(+레거시 null)만 지움. 신규 스코프: 레거시 null만 정리하고 다른 파일 셋은 유지.
			List<QuizSet> toDelete = previousSets.stream()
					.filter(set -> replacing
							? (set.getSourcePath() == null || Objects.equals(sourcePath, set.getSourcePath()))
							: set.getSourcePath() == null)
					.toList();
			avoidQuestions.addAll(collectAvoidQuestions(replacing ? toDelete : previousSets));

			if (!toDelete.isEmpty()) {
				List<Long> deleteIds = toDelete.stream().map(QuizSet::getId).toList();
				quizProgressRepository.deleteAllByQuizSetIdIn(deleteIds);
				quizSetRepository.deleteAll(toDelete);
			}

			return quizSetRepository.save(QuizSet.builder()
					.projectId(projectId)
					.versionHash(request.versionHash())
					.mode(request.mode())
					.requestedCount(request.count())
					.ratioEasy(request.ratioEasy())
					.ratioNormal(request.ratioNormal())
					.ratioHard(request.ratioHard())
					.userPrompt(request.userPrompt())
					.createdBy(requester.id())
					.sourcePath(sourcePath)
					.sourceKind(sourceKind)
					.build());
		});

		try {
			String callbackUrl = callbackBaseUrl + "/api/quiz/" + quizSet.getId() + "/callback";
			AiQuizSetAccepted accepted = quizAiClient.createQuizSet(
					projectId, AiQuizCreateRequest.from(request, avoidQuestions, callbackUrl));
			quizSet.markGenerating(accepted.quizSetId());
		} catch (QuizAiException e) {
			quizSet.fail(e.getMessage());
		}

		return QuizGenerateResponse.from(quizSetRepository.save(quizSet));
	}

	/**
	 * 재생성 시 AI 가 피해야 할 '이전 출제 문항' 목록. 최신 세트부터 "[개념] 질문" 형태로 만들고,
	 * 항목당 {@value #AVOID_QUESTION_MAX_CHARS}자·전체 {@value #AVOID_QUESTIONS_LIMIT}건으로 자른다.
	 */
	private List<String> collectAvoidQuestions(List<QuizSet> previousSets) {
		return previousSets.stream()
				.flatMap(set -> set.getQuizzes().stream())
				.map(QuizService::formatAvoidQuestion)
				.limit(AVOID_QUESTIONS_LIMIT)
				.toList();
	}

	private static String formatAvoidQuestion(Quiz quiz) {
		String concept = quiz.getTestedConcept();
		String entry = (concept == null || concept.isBlank())
				? quiz.getQuestion()
				: "[" + concept + "] " + quiz.getQuestion();
		return entry.length() > AVOID_QUESTION_MAX_CHARS
				? entry.substring(0, AVOID_QUESTION_MAX_CHARS)
				: entry;
	}

	/**
	 * 프로젝트에 묶인 퀴즈셋 목록(최신순). 새로고침·재입장 시 생성 중/완료 상태를 복원하는 기준점이다.
	 */
	@Transactional(readOnly = true)
	public List<QuizSetSummaryResponse> listByProject(Long projectId, AuthUser requester) {
		requireAuthenticated(requester);
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다: " + projectId));
		if (!MASTER_ROLE.equals(requester.role())) {
			participantService.verifySessionClassMember(project.getSessionId(), requester);
		}

		return quizSetRepository.findByProjectIdOrderByIdDesc(projectId).stream()
				.limit(20)
				.map(QuizSetSummaryResponse::from)
				.toList();
	}

	/**
	 * 퀴즈셋 조회(정답 포함, 출제자 전용). 생성 중이면 AI 서버 상태를 함께 확인해서 완료(READY)면
	 * 문항을 저장하고 COMPLETED 로 넘긴다 — 콜백이 오지 않았을 때(네트워크 문제 등)를 대비한 안전망이다.
	 */
	@Transactional
	public QuizSetDetailResponse getQuizSet(Long quizSetId, AuthUser requester) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		verifyInstructorAccess(quizSet, requester);

		String generationStage = syncFromAi(quizSet);
		trimSurplusQuizzes(quizSet);
		primeChoices(quizSet);

		return QuizSetDetailResponse.from(quizSet, generationStage);
	}

	/**
	 * 학생 응시용 문항 조회. 세션이 열린 반의 구성원이면 볼 수 있고, 정답·해설은 응답에 담기지 않는다.
	 */
	@Transactional
	public QuizQuestionsResponse getQuizQuestions(Long quizSetId, AuthUser requester) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);

		String generationStage = syncFromAi(quizSet);
		trimSurplusQuizzes(quizSet);
		primeChoices(quizSet);

		return QuizQuestionsResponse.from(quizSet, generationStage);
	}

	/**
	 * 응답 DTO 가 문항마다 choices 를 지연 로딩하면 문항 수만큼 SELECT 가 나간다(N+1).
	 * fetch join 으로 세트의 모든 보기를 한 번에 영속성 컨텍스트에 올려 이후 접근이 쿼리 없이 끝나게 한다.
	 */
	private void primeChoices(QuizSet quizSet) {
		quizRepository.findAllWithChoicesByQuizSetId(quizSet.getId());
	}

	/**
	 * 응시자(학생 포함) 퀴즈 품질 만족도. 사용자별 1건을 저장한다.
	 * 강사도 남길 수 있지만 출제자 전용 필드는 쓰지 않는다.
	 */
	@Transactional
	public QuizSetSummaryResponse submitSatisfaction(
			Long quizSetId, QuizSatisfactionRequest request, AuthUser requester) {
		requireAuthenticated(requester);
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);
		if (quizSet.getStatus() != QuizSetStatus.COMPLETED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "완료된 퀴즈에만 만족도를 남길 수 있습니다.");
		}
		QuizSatisfaction row = quizSatisfactionRepository
				.findByQuizSetIdAndUserId(quizSetId, requester.id())
				.orElseGet(() -> new QuizSatisfaction(quizSetId, requester.id(), request.rating(), request.comment()));
		row.update(request.rating(), request.comment());
		quizSatisfactionRepository.save(row);
		return QuizSetSummaryResponse.from(quizSet);
	}

	@Transactional(readOnly = true)
	public boolean hasMySatisfaction(Long quizSetId, AuthUser requester) {
		requireAuthenticated(requester);
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);
		return quizSatisfactionRepository.existsByQuizSetIdAndUserId(quizSetId, requester.id());
	}

	private static String resolveSourcePath(QuizGenerateRequest request) {
		if (request.sourcePath() != null && !request.sourcePath().isBlank()) {
			return request.sourcePath().trim();
		}
		if (request.targetFiles() != null && !request.targetFiles().isEmpty()) {
			return request.targetFiles().get(0);
		}
		return request.files().keySet().stream().sorted().findFirst()
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "출제 대상 파일이 없습니다."));
	}

	private static String resolveSourceKind(QuizGenerateRequest request, String sourcePath) {
		if (request.sourceKind() != null && !request.sourceKind().isBlank()) {
			return request.sourceKind().trim().toLowerCase();
		}
		if (request.targetFiles() != null && request.targetFiles().size() > 1) {
			return "dir";
		}
		return sourcePath.endsWith("/") ? "dir" : "file";
	}

	/**
	 * 정답이 포함된 상세는 강사/마스터만 볼 수 있다. 세션 활성 여부는 보지 않는다 —
	 * 세션을 닫은 뒤에 결과를 검토하는 흐름을 막지 않기 위해서다.
	 */
	private void verifyInstructorAccess(QuizSet quizSet, AuthUser requester) {
		requireAuthenticated(requester);
		if (MASTER_ROLE.equals(requester.role())) {
			return;
		}
		if (!MANAGER_ROLE.equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "정답이 포함된 퀴즈 상세는 강사만 볼 수 있습니다.");
		}
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);
	}

	private void verifyCanGenerate(Long sessionId, AuthUser requester) {
		if (MASTER_ROLE.equals(requester.role())) {
			return;
		}
		if (!MANAGER_ROLE.equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "퀴즈 생성은 강사만 할 수 있습니다.");
		}
		participantService.verifySessionClassMember(sessionId, requester);
	}

	private void requireAuthenticated(AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
	}

	private Long sessionIdOf(QuizSet quizSet) {
		return projectRepository.findById(quizSet.getProjectId())
				.map(Project::getSessionId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋의 프로젝트를 찾을 수 없습니다: " + quizSet.getProjectId()));
	}

	/**
	 * AI 서버가 생성을 마치고 보내는 콜백. 정상 경로에서는 이 호출이 문항 저장과 세션 알림을 담당하고,
	 * getQuizSet 의 폴링 동기화는 콜백이 유실됐을 때만 뒤늦게 같은 일을 한다.
	 *
	 * 콜백은 중복 전송될 수 있으므로(재시도 등) 이미 처리된 세트는 조용히 무시한다.
	 */
	@Transactional
	public void handleCallback(Long quizSetId, AiQuizStatusResponse payload) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		if (quizSet.getStatus() != QuizSetStatus.GENERATING) {
			return;
		}
		if (quizSet.getAiQuizSetId() != null && !quizSet.getAiQuizSetId().equals(payload.quizSetId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "콜백의 quiz_set_id 가 일치하지 않습니다.");
		}

		applyAiResult(quizSet, payload);
	}

	/**
	 * @return 아직 생성 중이면 AI meter 의 마지막 stage(GENERATE/SOLVE/JUDGE), 아니면 null.
	 *         프론트 진행바가 단계를 표시하는 데 쓴다.
	 */
	private String syncFromAi(QuizSet quizSet) {
		if (quizSet.getStatus() != QuizSetStatus.GENERATING || quizSet.getAiQuizSetId() == null) {
			return null;
		}

		AiQuizStatusResponse aiResponse;
		try {
			aiResponse = quizAiClient.getStatus(quizSet.getAiQuizSetId());
		} catch (QuizAiException e) {
			// AI 가 잠깐 안 붙는 것은 조회 실패가 아니다. 지금 상태를 그대로 돌려주고 다음 폴링에 맡긴다.
			return null;
		}

		applyAiResult(quizSet, aiResponse);

		return quizSet.getStatus() == QuizSetStatus.GENERATING ? latestStage(aiResponse) : null;
	}

	private String latestStage(AiQuizStatusResponse aiResponse) {
		List<AiQuizStatusResponse.AiLlmCall> meter = aiResponse.meter();
		if (meter == null || meter.isEmpty()) {
			return null;
		}
		return meter.get(meter.size() - 1).stage();
	}

	private void applyAiResult(QuizSet quizSet, AiQuizStatusResponse aiResponse) {
		switch (aiResponse.status()) {
			case READY -> {
				applyGeneratedQuizzes(quizSet, aiResponse.quizzes());
				notifySession(quizSet);
			}
			case FAILED -> {
				quizSet.fail(
						aiResponse.errorMessage() != null ? aiResponse.errorMessage() : "AI 퀴즈 생성에 실패했습니다.");
				notifySession(quizSet);
			}
			case PENDING, GENERATING -> {
				// 승인된 문항이 먼저 올라오면 DB에 붙여 두고 세션에 알려 순차 표시한다.
				if (mergePartialQuizzes(quizSet, aiResponse.quizzes())) {
					notifySession(quizSet);
				}
			}
		}
	}

	/** 세트가 끝났음을 세션에 연결된 구성원들에게 웹소켓으로 알린다. */
	private void notifySession(QuizSet quizSet) {
		projectRepository.findById(quizSet.getProjectId()).ifPresentOrElse(
				project -> messagingTemplate.convertAndSend(
						"/topic/sessions/" + project.getSessionId() + "/quiz",
						QuizGenerationNotification.from(quizSet)),
				() -> log.warn("퀴즈 완료를 알릴 프로젝트를 찾지 못했습니다. projectId={}", quizSet.getProjectId()));
	}

	private QuizSet findQuizSetOrThrow(Long quizSetId) {
		return quizSetRepository.findById(quizSetId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋을 찾을 수 없습니다: " + quizSetId));
	}

	/**
	 * 생성 중 부분 문항 반영. 이미 저장된 개수보다 AI 쪽이 많으면 뒤만 이어 붙인다.
	 * AI 는 overshoot 로 요청 수보다 많은 승인분을 올릴 수 있어 requestedCount 까지만 저장한다.
	 * @return 새 문항이 추가됐으면 true
	 */
	private boolean mergePartialQuizzes(QuizSet quizSet, List<AiQuizStatusResponse.AiQuiz> aiQuizzes) {
		List<AiQuizStatusResponse.AiQuiz> generated = aiQuizzes == null ? List.of() : aiQuizzes;
		int already = quizSet.getQuizzes().size();
		int cap = quizSet.getRequestedCount();
		int limit = cap > 0 ? Math.min(generated.size(), cap) : generated.size();
		if (limit <= already) {
			return false;
		}
		appendQuizzes(quizSet, generated.subList(already, limit), already + 1);
		quizSet.updateProgress(quizSet.getQuizzes().size());
		return true;
	}

	/**
	 * READY 최종 개수에 맞춘다. 생성 중 overshoot 여분이 남아 있으면 뒤쪽 문항만 제거하고,
	 * 모자라면 이어 붙인다. 개수가 같으면 부분 반영분을 유지해 생성 중 응시 기록을 보존한다.
	 */
	private void applyGeneratedQuizzes(QuizSet quizSet, List<AiQuizStatusResponse.AiQuiz> aiQuizzes) {
		List<AiQuizStatusResponse.AiQuiz> generated = aiQuizzes == null ? List.of() : aiQuizzes;
		int already = quizSet.getQuizzes().size();
		if (already > generated.size()) {
			trimQuizzesTo(quizSet, generated.size());
		} else if (already < generated.size()) {
			appendQuizzes(quizSet, generated.subList(already, generated.size()), already + 1);
		}
		quizSet.complete(generated.size());
	}

	/** keep 개를 넘는 문항(orderNo 큰 쪽)과 그 응시 기록을 제거한다. */
	private void trimQuizzesTo(QuizSet quizSet, int keep) {
		if (keep < 0 || quizSet.getQuizzes().size() <= keep) {
			return;
		}
		List<Long> toRemove = quizSet.getQuizzes().stream()
				.sorted(java.util.Comparator.comparingInt(Quiz::getOrderNo)
						.thenComparing(quiz -> quiz.getId() == null ? Long.MAX_VALUE : quiz.getId()))
				.skip(keep)
				.map(Quiz::getId)
				.filter(java.util.Objects::nonNull)
				.toList();
		if (!toRemove.isEmpty()) {
			quizProgressRepository.deleteAllByQuizIdIn(toRemove);
			quizProgressRepository.flush();
		}
		quizSet.detachQuizzesBeyond(keep);
	}

	/** 이미 COMPLETED 인데 overshoot 여분이 DB 에 남은 세트를 조회/동기화 때 정리한다. */
	private void trimSurplusQuizzes(QuizSet quizSet) {
		if (quizSet.getStatus() != QuizSetStatus.COMPLETED) {
			return;
		}
		int keep = quizSet.getGeneratedCount() > 0
				? quizSet.getGeneratedCount()
				: quizSet.getRequestedCount();
		trimQuizzesTo(quizSet, keep);
	}

	private void appendQuizzes(
			QuizSet quizSet, List<AiQuizStatusResponse.AiQuiz> aiQuizzes, int startOrderNo) {
		int orderNo = startOrderNo;
		for (AiQuizStatusResponse.AiQuiz aiQuiz : aiQuizzes) {
			List<String> choices = aiQuiz.choices() == null ? List.of() : aiQuiz.choices();
			boolean answerInRange = aiQuiz.answerIndex() >= 0 && aiQuiz.answerIndex() < choices.size();

			Quiz quiz = Quiz.builder()
					.type(QuizType.MULTIPLE_CHOICE)
					.purpose(QuizPurpose.valueOf(aiQuiz.purpose()))
					.difficulty(QuizDifficulty.valueOf(aiQuiz.difficulty()))
					.testedConcept(aiQuiz.testedConcept())
					.question(aiQuiz.question())
					.answerText(answerInRange ? choices.get(aiQuiz.answerIndex()) : null)
					.explanation(aiQuiz.explanation())
					.filePath(aiQuiz.filePath())
					.lineStart(aiQuiz.lineStart())
					.lineEnd(aiQuiz.lineEnd())
					.timeLimitSec(DEFAULT_TIME_LIMIT_SEC)
					.orderNo(orderNo++)
					.build();
			for (int idx = 0; idx < choices.size(); idx++) {
				quiz.addChoice(QuizChoice.of(idx, choices.get(idx), idx == aiQuiz.answerIndex()));
			}
			quizSet.addQuiz(quiz);
		}
	}
}
