package com.roma.qurie.quiz.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.dto.QuizIncorrectProgressResponse;
import com.roma.qurie.quiz.dto.QuizProgressNotification;
import com.roma.qurie.quiz.dto.QuizProgressResponse;
import com.roma.qurie.quiz.dto.QuizProgressRosterItemResponse;
import com.roma.qurie.quiz.dto.QuizProgressRosterResponse;
import com.roma.qurie.quiz.dto.QuizProgressSubmitRequest;
import com.roma.qurie.quiz.dto.QuizProgressSummaryResponse;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantResolver;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** 학생의 문항 응시 기록. 세션이 열린 반의 구성원만 제출·조회할 수 있다(QuizService.getQuizQuestions 와 같은 자격). */
@Service
@RequiredArgsConstructor
public class QuizProgressService {

	private static final String DUPLICATE_MESSAGE = "이미 응시한 문항입니다.";

	private final QuizRepository quizRepository;
	private final QuizSetRepository quizSetRepository;
	private final QuizProgressRepository quizProgressRepository;
	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;
	private final SessionParticipantService participantService;
	private final SessionParticipantResolver participantResolver;
	private final SessionRepository sessionRepository;
	private final SimpMessagingTemplate messagingTemplate;

	@Transactional
	public QuizProgressResponse submit(
			Long quizSetId, Long quizId, AuthUser requester, QuizProgressSubmitRequest request) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		Long sessionId = sessionIdOf(quizSet);
		participantService.verifySessionClassMember(sessionId, requester);

		Quiz quiz = quizRepository.findByIdAndQuizSetId(quizId, quizSetId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문항을 찾을 수 없습니다: " + quizId));

		if (quizProgressRepository.existsByQuizIdAndUserId(quizId, requester.id())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_MESSAGE);
		}

		QuizChoice chosenChoice = resolveChosenChoice(quiz, request);
		User user = userRepository.findById(requester.id())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		QuizProgress saved;
		try {
			saved = quizProgressRepository.save(new QuizProgress(
					quiz, user, request.status(), chosenChoice, request.startedAt(), request.finishedAt()));
		} catch (DataIntegrityViolationException e) {
			// 존재 여부 검사와 저장 사이에 같은 응시가 먼저 들어오면 unique 제약으로만 걸러진다.
			throw new ResponseStatusException(HttpStatus.CONFLICT, DUPLICATE_MESSAGE, e);
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
		}

		notifyQuizProgress(quizSet, sessionId);
		return QuizProgressResponse.from(saved);
	}

	/**
	 * 문항 제출마다 세션에 응시 집계를 웹소켓으로 알린다.
	 * 강사 현황판이 "몇 명이 풀고 있는지 / 완료했는지"를 실시간으로 갱신하기 위함이다.
	 */
	private void notifyQuizProgress(QuizSet quizSet, Long sessionId) {
		Session session = sessionRepository.findById(sessionId).orElse(null);
		if (session == null) {
			return;
		}
		QuizProgressNotification notification = buildProgressNotification(quizSet, session);
		if (notification == null) {
			return;
		}
		messagingTemplate.convertAndSend("/topic/sessions/" + sessionId + "/quiz-progress", notification);
	}

	private QuizProgressNotification buildProgressNotification(QuizSet quizSet, Session session) {
		int totalQuizCount = quizSet.effectiveQuizCount();
		if (totalQuizCount == 0) {
			return null;
		}
		List<Long> studentIds = participantResolver.resolveStudentIds(session);
		Map<Long, Long> answeredByUser = answeredCountByUser(quizSet.getId());
		int started = 0;
		int inProgress = 0;
		int completed = 0;
		for (Long studentId : studentIds) {
			long answered = answeredByUser.getOrDefault(studentId, 0L);
			if (answered <= 0) {
				continue;
			}
			started++;
			if (answered >= totalQuizCount) {
				completed++;
			} else {
				inProgress++;
			}
		}
		int totalStudentCount = studentIds.size();
		return new QuizProgressNotification(
				quizSet.getId(),
				totalQuizCount,
				started,
				inProgress,
				completed,
				totalStudentCount,
				totalStudentCount > 0 && completed == totalStudentCount);
	}

	private Map<Long, Long> answeredCountByUser(Long quizSetId) {
		Map<Long, Long> answeredByUser = new HashMap<>();
		for (Object[] row : quizProgressRepository.countProgressByQuizSetIdGroupByUser(quizSetId)) {
			answeredByUser.put((Long) row[0], (Long) row[1]);
		}
		return answeredByUser;
	}

	/**
	 * 응시 현황 조회. userId 가 없으면 본인 기록, 있으면 해당 사용자 기록(강사·마스터만).
	 * 세션 리포트에서 학생별 선택 보기를 보여줄 때 쓴다.
	 */
	@Transactional(readOnly = true)
	public QuizProgressSummaryResponse getSummary(Long quizSetId, Long userId, AuthUser requester) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);

		Long targetUserId = userId != null ? userId : requester.id();
		if (!targetUserId.equals(requester.id())
				&& !"MANAGER".equals(requester.role())
				&& !"MASTER".equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 응시 기록을 조회할 권한이 없습니다.");
		}

		List<QuizProgress> progresses =
				quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(quizSetId, targetUserId);
		return QuizProgressSummaryResponse.from(quizSet, progresses);
	}

	@Transactional(readOnly = true)
	public QuizIncorrectProgressResponse getIncorrectSummary(Long quizSetId, AuthUser requester) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);

		List<QuizProgress> incorrectProgresses =
				quizProgressRepository.findIncorrectWithQuizByQuizSetIdAndUserId(quizSetId, requester.id());
		return QuizIncorrectProgressResponse.from(quizSetId, incorrectProgresses);
	}

	/**
	 * 강사·마스터 전용 학생 응시 현황. 세션 편성 학생을 기준으로 미시작·진행·완료를 나열한다.
	 */
	@Transactional(readOnly = true)
	public QuizProgressRosterResponse getRoster(Long quizSetId, AuthUser requester) {
		requireInstructor(requester);
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		Long sessionId = sessionIdOf(quizSet);
		participantService.verifySessionClassMember(sessionId, requester);

		Session session = sessionRepository
				.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "세션을 찾을 수 없습니다."));

		int totalQuizCount = quizSet.effectiveQuizCount();
		List<Long> studentIds = participantResolver.resolveStudentIds(session);
		Map<Long, Long> answeredByUser = answeredCountByUser(quizSetId);
		Map<Long, Integer> correctByUser = correctCountByUser(quizSetId);
		Map<Long, String> names = userRepository.findAllById(studentIds).stream()
				.collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));

		List<QuizProgressRosterItemResponse> students = new ArrayList<>(studentIds.size());
		int started = 0;
		int inProgress = 0;
		int completed = 0;
		for (Long studentId : studentIds) {
			int answered = answeredByUser.getOrDefault(studentId, 0L).intValue();
			int correct = correctByUser.getOrDefault(studentId, 0);
			String status;
			if (answered <= 0) {
				status = "NOT_STARTED";
			} else if (totalQuizCount > 0 && answered >= totalQuizCount) {
				status = "COMPLETED";
				completed++;
				started++;
			} else {
				status = "IN_PROGRESS";
				inProgress++;
				started++;
			}
			students.add(new QuizProgressRosterItemResponse(
					studentId,
					names.getOrDefault(studentId, "알 수 없음"),
					answered,
					correct,
					totalQuizCount,
					status));
		}

		students.sort((a, b) -> {
			int rank = Integer.compare(statusRank(a.status()), statusRank(b.status()));
			if (rank != 0) {
				return rank;
			}
			return a.userName().compareToIgnoreCase(b.userName());
		});

		int totalStudentCount = studentIds.size();
		return new QuizProgressRosterResponse(
				quizSetId,
				totalQuizCount,
				totalStudentCount,
				started,
				inProgress,
				completed,
				totalStudentCount > 0 && completed == totalStudentCount,
				students);
	}

	private Map<Long, Integer> correctCountByUser(Long quizSetId) {
		Map<Long, Integer> correctByUser = new HashMap<>();
		for (QuizProgress progress : quizProgressRepository.findAllWithQuizByQuizSetId(quizSetId)) {
			if (!Boolean.TRUE.equals(progress.getIsCorrect())) {
				continue;
			}
			Long userId = progress.getUser().getId();
			correctByUser.merge(userId, 1, Integer::sum);
		}
		return correctByUser;
	}

	private static int statusRank(String status) {
		return switch (status) {
			case "IN_PROGRESS" -> 0;
			case "COMPLETED" -> 1;
			default -> 2;
		};
	}

	private static void requireInstructor(AuthUser requester) {
		if (requester == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		if (!"MANAGER".equals(requester.role()) && !"MASTER".equals(requester.role())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "응시 현황은 강사만 조회할 수 있습니다.");
		}
	}

	/** ATTEMPTED 가 아니면 고른 보기가 없다. ATTEMPTED 인데 idx 가 문항의 실제 보기 범위를 벗어나면 잘못된 요청이다. */
	private QuizChoice resolveChosenChoice(Quiz quiz, QuizProgressSubmitRequest request) {
		if (request.status() != QuizProgressStatus.ATTEMPTED) {
			return null;
		}
		if (request.chosenChoiceIdx() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "응시 처리에는 고른 보기가 필요합니다.");
		}
		return quiz.getChoices().stream()
				.filter(choice -> choice.getIdx() == request.chosenChoiceIdx())
				.findFirst()
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.BAD_REQUEST, "존재하지 않는 보기입니다: " + request.chosenChoiceIdx()));
	}

	private QuizSet findQuizSetOrThrow(Long quizSetId) {
		return quizSetRepository.findById(quizSetId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋을 찾을 수 없습니다: " + quizSetId));
	}

	private Long sessionIdOf(QuizSet quizSet) {
		return projectRepository.findById(quizSet.getProjectId())
				.map(Project::getSessionId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "퀴즈셋의 프로젝트를 찾을 수 없습니다: " + quizSet.getProjectId()));
	}
}
