package com.roma.qurie.quiz.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.dto.QuizProgressNotification;
import com.roma.qurie.quiz.dto.QuizProgressResponse;
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

		notifyIfQuizSetCompleted(quizSet, sessionId, requester.id());
		return QuizProgressResponse.from(saved);
	}

	/**
	 * 이번 제출로 사용자가 세트의 모든 문항을 마쳤으면 세션에 완주 현황을 웹소켓으로 알린다.
	 * 강사 화면이 폴링 없이 "몇 명이 다 풀었는지"를 갱신하기 위한 알림이라 완주가 아닌 제출에는 보내지 않는다.
	 */
	private void notifyIfQuizSetCompleted(QuizSet quizSet, Long sessionId, Long userId) {
		int totalQuizCount = quizSet.getQuizzes().size();
		if (totalQuizCount == 0) {
			return;
		}
		if (quizProgressRepository.countByQuizSetIdAndUserId(quizSet.getId(), userId) < totalQuizCount) {
			return;
		}
		Session session = sessionRepository.findById(sessionId).orElse(null);
		if (session == null) {
			return;
		}

		List<Long> studentIds = participantResolver.resolveStudentIds(session);
		// 강사 등 편성 밖 사용자의 응시가 섞여도 분자·분모가 어긋나지 않도록 참여 학생 기준으로만 센다.
		Set<Long> completedUserIds = quizProgressRepository.countProgressByQuizSetIdGroupByUser(quizSet.getId())
				.stream()
				.filter(row -> ((Long) row[1]) >= totalQuizCount)
				.map(row -> (Long) row[0])
				.collect(Collectors.toSet());
		int completedStudentCount = (int) studentIds.stream().filter(completedUserIds::contains).count();
		int totalStudentCount = studentIds.size();

		messagingTemplate.convertAndSend(
				"/topic/sessions/" + sessionId + "/quiz-progress",
				new QuizProgressNotification(
						quizSet.getId(),
						completedStudentCount,
						totalStudentCount,
						totalStudentCount > 0 && completedStudentCount == totalStudentCount));
	}

	@Transactional(readOnly = true)
	public QuizProgressSummaryResponse getSummary(Long quizSetId, AuthUser requester) {
		QuizSet quizSet = findQuizSetOrThrow(quizSetId);
		participantService.verifySessionClassMember(sessionIdOf(quizSet), requester);

		List<QuizProgress> progresses =
				quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(quizSetId, requester.id());
		return QuizProgressSummaryResponse.from(quizSet, progresses);
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
