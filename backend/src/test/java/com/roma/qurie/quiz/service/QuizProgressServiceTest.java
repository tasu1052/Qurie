package com.roma.qurie.quiz.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.dto.QuizIncorrectProgressResponse;
import com.roma.qurie.quiz.dto.QuizProgressNotification;
import com.roma.qurie.quiz.dto.QuizProgressResponse;
import com.roma.qurie.quiz.dto.QuizProgressSubmitRequest;
import com.roma.qurie.quiz.dto.QuizProgressSummaryResponse;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizChoice;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizGenerationMode;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizPurpose;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizType;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantResolver;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class QuizProgressServiceTest {

	private static final Long PROJECT_ID = 1L;
	private static final Long SESSION_ID = 100L;
	private static final Long QUIZ_SET_ID = 10L;
	private static final Long QUIZ_ID = 20L;
	private static final AuthUser STUDENT =
			new AuthUser(7L, UserRole.STUDENT.name(), 1L, "student@qurie.com", "학생", 5L);

	@Mock
	private QuizRepository quizRepository;

	@Mock
	private QuizSetRepository quizSetRepository;

	@Mock
	private QuizProgressRepository quizProgressRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private ProjectRepository projectRepository;

	@Mock
	private SessionParticipantService participantService;

	@Mock
	private SessionParticipantResolver participantResolver;

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private SimpMessagingTemplate messagingTemplate;

	@InjectMocks
	private QuizProgressService quizProgressService;

	@Test
	void submitMarksCorrectWhenChosenChoiceIsTheAnswer() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		Quiz quiz = quizWithChoices();
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quiz));
		given(quizProgressRepository.existsByQuizIdAndUserId(QUIZ_ID, STUDENT.id())).willReturn(false);
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));

		QuizProgressResponse response = quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(2));

		verify(participantService).verifySessionClassMember(SESSION_ID, STUDENT);
		assertThat(response.status()).isEqualTo(QuizProgressStatus.ATTEMPTED);
		assertThat(response.chosenChoiceIdx()).isEqualTo(2);
		assertThat(response.isCorrect()).isTrue();
	}

	@Test
	void submitMarksIncorrectWhenChosenChoiceIsNotTheAnswer() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));

		QuizProgressResponse response = quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(0));

		assertThat(response.isCorrect()).isFalse();
	}

	@Test
	void submitSkippedHasNoChosenChoiceOrCorrectness() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));
		LocalDateTime start = LocalDateTime.now();
		QuizProgressSubmitRequest request =
				new QuizProgressSubmitRequest(QuizProgressStatus.SKIPPED, null, start, start.plusSeconds(1));

		QuizProgressResponse response = quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, request);

		assertThat(response.status()).isEqualTo(QuizProgressStatus.SKIPPED);
		assertThat(response.chosenChoiceIdx()).isNull();
		assertThat(response.isCorrect()).isNull();
	}

	@Test
	void submitThrowsBadRequestWhenAttemptedWithoutChoice() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		LocalDateTime start = LocalDateTime.now();
		QuizProgressSubmitRequest request =
				new QuizProgressSubmitRequest(QuizProgressStatus.ATTEMPTED, null, start, start.plusSeconds(1));

		assertThatThrownBy(() -> quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, request))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizProgressServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);

		verify(quizProgressRepository, never()).save(any());
	}

	@Test
	void submitThrowsConflictWhenAlreadyAttempted() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(quizProgressRepository.existsByQuizIdAndUserId(QUIZ_ID, STUDENT.id())).willReturn(true);

		assertThatThrownBy(() -> quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(1)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizProgressServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);
	}

	@Test
	void submitThrowsConflictWhenUniqueConstraintRejectsRaceyDuplicate() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class)))
				.willThrow(new DataIntegrityViolationException("uk_quiz_progress_quiz_user"));

		assertThatThrownBy(() -> quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(1)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizProgressServiceTest::statusOf)
				.isEqualTo(HttpStatus.CONFLICT);
	}

	@Test
	void submitThrowsNotFoundWhenQuizDoesNotBelongToQuizSet() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(1)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(QuizProgressServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void submitBroadcastsCompletionWhenUserFinishesWholeQuizSet() {
		QuizSet quizSet = quizSet();
		quizSet.addQuiz(quizWithChoices());
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));
		Session session = sessionOfClass();
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.resolveStudentIds(session)).willReturn(List.of(STUDENT.id(), 8L));
		given(quizProgressRepository.countProgressByQuizSetIdGroupByUser(QUIZ_SET_ID))
				.willReturn(List.<Object[]>of(new Object[] {STUDENT.id(), 1L}, new Object[] {8L, 0L}));

		quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(2));

		ArgumentCaptor<QuizProgressNotification> captor = ArgumentCaptor.forClass(QuizProgressNotification.class);
		verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz-progress"), captor.capture());
		assertThat(captor.getValue().quizSetId()).isEqualTo(QUIZ_SET_ID);
		assertThat(captor.getValue().totalQuizCount()).isEqualTo(1);
		assertThat(captor.getValue().startedStudentCount()).isEqualTo(1);
		assertThat(captor.getValue().inProgressStudentCount()).isEqualTo(0);
		assertThat(captor.getValue().completedStudentCount()).isEqualTo(1);
		assertThat(captor.getValue().totalStudentCount()).isEqualTo(2);
		assertThat(captor.getValue().allCompleted()).isFalse();
	}

	@Test
	void submitBroadcastsAllCompletedWhenEveryStudentFinished() {
		QuizSet quizSet = quizSet();
		quizSet.addQuiz(quizWithChoices());
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));
		Session session = sessionOfClass();
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.resolveStudentIds(session)).willReturn(List.of(STUDENT.id()));
		given(quizProgressRepository.countProgressByQuizSetIdGroupByUser(QUIZ_SET_ID))
				.willReturn(List.<Object[]>of(new Object[] {STUDENT.id(), 1L}));

		quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(2));

		ArgumentCaptor<QuizProgressNotification> captor = ArgumentCaptor.forClass(QuizProgressNotification.class);
		verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz-progress"), captor.capture());
		assertThat(captor.getValue().allCompleted()).isTrue();
	}

	@Test
	void submitBroadcastsPartialProgressWhenQuizSetIsNotFinishedYet() {
		QuizSet quizSet = quizSet();
		quizSet.addQuiz(quizWithChoices());
		quizSet.addQuiz(quizWithChoices());
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizRepository.findByIdAndQuizSetId(QUIZ_ID, QUIZ_SET_ID)).willReturn(Optional.of(quizWithChoices()));
		given(userRepository.findById(STUDENT.id())).willReturn(Optional.of(student()));
		given(quizProgressRepository.save(any(QuizProgress.class))).willAnswer(invocation -> invocation.getArgument(0));
		Session session = sessionOfClass();
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.resolveStudentIds(session)).willReturn(List.of(STUDENT.id(), 8L));
		given(quizProgressRepository.countProgressByQuizSetIdGroupByUser(QUIZ_SET_ID))
				.willReturn(List.<Object[]>of(new Object[] {STUDENT.id(), 1L}));

		quizProgressService.submit(QUIZ_SET_ID, QUIZ_ID, STUDENT, attemptRequest(2));

		ArgumentCaptor<QuizProgressNotification> captor = ArgumentCaptor.forClass(QuizProgressNotification.class);
		verify(messagingTemplate)
				.convertAndSend(eq("/topic/sessions/" + SESSION_ID + "/quiz-progress"), captor.capture());
		assertThat(captor.getValue().totalQuizCount()).isEqualTo(2);
		assertThat(captor.getValue().startedStudentCount()).isEqualTo(1);
		assertThat(captor.getValue().inProgressStudentCount()).isEqualTo(1);
		assertThat(captor.getValue().completedStudentCount()).isEqualTo(0);
		assertThat(captor.getValue().allCompleted()).isFalse();
	}

	@Test
	void getSummaryCountsAttemptedAndCorrect() {
		QuizSet quizSet = quizSet();
		quizSet.addQuiz(quizWithChoices());
		quizSet.addQuiz(quizWithChoices());
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		QuizProgress correct = new QuizProgress(
				quizWithChoices(), student(), QuizProgressStatus.ATTEMPTED, correctChoice(),
				LocalDateTime.now(), LocalDateTime.now().plusSeconds(5));
		given(quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(QUIZ_SET_ID, STUDENT.id()))
				.willReturn(List.of(correct));

		QuizProgressSummaryResponse response = quizProgressService.getSummary(QUIZ_SET_ID, null, STUDENT);

		assertThat(response.totalCount()).isEqualTo(2);
		assertThat(response.attemptedCount()).isEqualTo(1);
		assertThat(response.correctCount()).isEqualTo(1);
	}

	@Test
	void getIncorrectSummaryReturnsOnlyIncorrectItems() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		QuizProgress incorrect = new QuizProgress(
				quizWithChoices(), student(), QuizProgressStatus.ATTEMPTED, incorrectChoice(),
				LocalDateTime.now(), LocalDateTime.now().plusSeconds(5));
		given(quizProgressRepository.findIncorrectWithQuizByQuizSetIdAndUserId(QUIZ_SET_ID, STUDENT.id()))
				.willReturn(List.of(incorrect));

		QuizIncorrectProgressResponse response = quizProgressService.getIncorrectSummary(QUIZ_SET_ID, STUDENT);

		verify(participantService).verifySessionClassMember(SESSION_ID, STUDENT);
		assertThat(response.quizSetId()).isEqualTo(QUIZ_SET_ID);
		assertThat(response.incorrectCount()).isEqualTo(1);
		assertThat(response.items()).hasSize(1);
		assertThat(response.items().get(0).isCorrect()).isFalse();
	}

	@Test
	void getIncorrectSummaryReturnsEmptyWhenNothingWasWrong() {
		given(quizSetRepository.findById(QUIZ_SET_ID)).willReturn(Optional.of(quizSet()));
		given(projectRepository.findById(PROJECT_ID)).willReturn(Optional.of(project()));
		given(quizProgressRepository.findIncorrectWithQuizByQuizSetIdAndUserId(QUIZ_SET_ID, STUDENT.id()))
				.willReturn(List.of());

		QuizIncorrectProgressResponse response = quizProgressService.getIncorrectSummary(QUIZ_SET_ID, STUDENT);

		assertThat(response.incorrectCount()).isEqualTo(0);
		assertThat(response.items()).isEmpty();
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException) throwable).getStatusCode();
	}

	private QuizProgressSubmitRequest attemptRequest(int choiceIdx) {
		LocalDateTime start = LocalDateTime.now();
		return new QuizProgressSubmitRequest(QuizProgressStatus.ATTEMPTED, choiceIdx, start, start.plusSeconds(5));
	}

	private QuizSet quizSet() {
		QuizSet quizSet = QuizSet.builder()
				.projectId(PROJECT_ID)
				.versionHash("abc123")
				.mode(QuizGenerationMode.ASSESSMENT)
				.requestedCount(5)
				.ratioEasy(30)
				.ratioNormal(50)
				.ratioHard(20)
				.createdBy(2L)
				.build();
		ReflectionTestUtils.setField(quizSet, "id", QUIZ_SET_ID);
		return quizSet;
	}

	private Quiz quizWithChoices() {
		Quiz quiz = Quiz.builder()
				.type(QuizType.MULTIPLE_CHOICE)
				.purpose(QuizPurpose.MICRO)
				.difficulty(QuizDifficulty.NORMAL)
				.testedConcept("동시성 제어")
				.question("이 코드에서 락 획득 순서는?")
				.timeLimitSec(60)
				.orderNo(1)
				.build();
		ReflectionTestUtils.setField(quiz, "id", QUIZ_ID);
		quiz.addChoice(QuizChoice.of(0, "A", false));
		quiz.addChoice(QuizChoice.of(1, "B", false));
		quiz.addChoice(QuizChoice.of(2, "C", true));
		quiz.addChoice(QuizChoice.of(3, "D", false));
		return quiz;
	}

	private QuizChoice correctChoice() {
		return quizWithChoices().getChoices().get(2);
	}

	private QuizChoice incorrectChoice() {
		return quizWithChoices().getChoices().get(0);
	}

	private User student() {
		User user = User.builder()
				.enterpriseId(1L)
				.email("student@qurie.com")
				.role(UserRole.STUDENT)
				.password("{bcrypt}encoded")
				.name("학생")
				.build();
		ReflectionTestUtils.setField(user, "id", STUDENT.id());
		return user;
	}

	private Project project() {
		return new Project(SESSION_ID, null, 2L);
	}

	private Session sessionOfClass() {
		return new Session(5L, null, "수업 방", 2L, true);
	}
}
