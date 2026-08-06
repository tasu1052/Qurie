package com.roma.qurie.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.roma.qurie.project.Project;
import com.roma.qurie.project.ProjectRepository;
import com.roma.qurie.quiz.entity.Quiz;
import com.roma.qurie.quiz.entity.QuizDifficulty;
import com.roma.qurie.quiz.entity.QuizProgress;
import com.roma.qurie.quiz.entity.QuizProgressStatus;
import com.roma.qurie.quiz.entity.QuizSet;
import com.roma.qurie.quiz.entity.QuizSetStatus;
import com.roma.qurie.quiz.repository.QuizProgressRepository;
import com.roma.qurie.quiz.repository.QuizSetRepository;
import com.roma.qurie.report.dto.SessionReportBulkResponse;
import com.roma.qurie.report.dto.SessionReportCreateRequest;
import com.roma.qurie.report.dto.SessionReportRosterResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.Session;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.session.participant.SessionParticipantResolver;
import com.roma.qurie.session.participant.SessionParticipantService;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SessionReportServiceTest {

	private static final Long SESSION_ID = 5L;
	private static final Long USER_ID = 7L;
	private static final Long PROJECT_ID = 11L;
	private static final Long QUIZ_SET_ID = 100L;
	private static final AuthUser MANAGER =
			new AuthUser(10L, "MANAGER", 1L, "manager@qurie.com", "매니저", 1L);
	private static final AuthUser STUDENT =
			new AuthUser(20L, "STUDENT", 1L, "student@qurie.com", "학생", 1L);

	@Mock
	private SessionReportRepository sessionReportRepository;

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private SessionParticipantService sessionParticipantService;

	@Mock
	private SessionParticipantResolver participantResolver;

	@Mock
	private ProjectRepository projectRepository;

	@Mock
	private QuizSetRepository quizSetRepository;

	@Mock
	private QuizProgressRepository quizProgressRepository;

	@Mock
	private Session session;

	@InjectMocks
	private SessionReportService sessionReportService;

	@Test
	void 정량_지표를_quiz_progress에서_집계해_저장한다() {
		givenIssuableSession();

		Quiz easyCorrect = quiz(QuizDifficulty.EASY, "JPA");
		Quiz easySkipped = quiz(QuizDifficulty.EASY, "JPA");
		Quiz normalWrong = quiz(QuizDifficulty.NORMAL, "트랜잭션");
		Quiz hardUntouched = quiz(QuizDifficulty.HARD, null);
		givenCompletedQuizSet(List.of(easyCorrect, easySkipped, normalWrong, hardUntouched));

		QuizProgress correct = attempted(easyCorrect, true, 8_000L);
		QuizProgress skipped = skipped(easySkipped);
		QuizProgress wrong = attempted(normalWrong, false, 12_000L);
		given(quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(QUIZ_SET_ID, USER_ID))
				.willReturn(List.of(correct, skipped, wrong));

		sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER);

		SessionReport saved = capturedReport();
		assertThat(saved.getQuizSetId()).isEqualTo(QUIZ_SET_ID);
		assertThat(saved.getQuizTotalCount()).isEqualTo(4);
		assertThat(saved.getQuizAttemptedCount()).isEqualTo(2);
		assertThat(saved.getQuizCorrectCount()).isEqualTo(1);
		assertThat(saved.getQuizSkippedCount()).isEqualTo(1);
		assertThat(saved.getCompletionRate()).isEqualByComparingTo("50.00");
		assertThat(saved.getAccuracy()).isEqualByComparingTo("50.00");
		assertThat(saved.getAvgElapsedMs()).isEqualTo(10_000);
		assertThat(saved.getQuizRating()).isEqualByComparingTo("4.5");
		assertThat(saved.getAiComment()).isEqualTo("기초가 탄탄합니다.");
	}

	@Test
	void 난이도와_개념_통계는_합산_가능한_개수로_저장한다() {
		givenIssuableSession();

		Quiz easyCorrect = quiz(QuizDifficulty.EASY, "JPA");
		Quiz easySkipped = quiz(QuizDifficulty.EASY, "JPA");
		Quiz normalWrong = quiz(QuizDifficulty.NORMAL, "트랜잭션");
		Quiz hardUntouched = quiz(QuizDifficulty.HARD, " ");
		givenCompletedQuizSet(List.of(easyCorrect, easySkipped, normalWrong, hardUntouched));

		List<QuizProgress> progresses = List.of(attempted(easyCorrect, true, 8_000L), skipped(easySkipped),
				attempted(normalWrong, false, 12_000L));
		given(quizProgressRepository.findAllWithQuizByQuizSetIdAndUserId(QUIZ_SET_ID, USER_ID))
				.willReturn(progresses);

		sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER);

		SessionReport saved = capturedReport();
		assertThat(saved.getDifficultyRatio()).containsOnlyKeys("EASY", "NORMAL", "HARD");
		assertThat(asCounts(saved.getDifficultyRatio().get("EASY")))
				.containsEntry("total", 2).containsEntry("attempted", 1).containsEntry("correct", 1);
		assertThat(asCounts(saved.getDifficultyRatio().get("HARD")))
				.containsEntry("total", 1).containsEntry("attempted", 0).containsEntry("correct", 0);

		assertThat(saved.getConceptStats()).containsOnlyKeys("JPA", "트랜잭션", "기타");
		assertThat(asCounts(saved.getConceptStats().get("JPA")))
				.containsEntry("total", 2).containsEntry("attempted", 1).containsEntry("correct", 1);
		assertThat(asCounts(saved.getConceptStats().get("기타")))
				.containsEntry("total", 1).containsEntry("attempted", 0).containsEntry("correct", 0);
	}

	@Test
	void 완료된_퀴즈셋이_없으면_지표_0건으로_발급한다() {
		givenIssuableSession();
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID)).willReturn(Optional.empty());

		sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER);

		SessionReport saved = capturedReport();
		assertThat(saved.getQuizSetId()).isNull();
		assertThat(saved.getQuizTotalCount()).isZero();
		assertThat(saved.getQuizAttemptedCount()).isZero();
		assertThat(saved.getCompletionRate()).isNull();
		assertThat(saved.getAccuracy()).isNull();
		assertThat(saved.getAvgElapsedMs()).isNull();
		assertThat(saved.getDifficultyRatio()).isEmpty();
		assertThat(saved.getConceptStats()).isEmpty();
	}

	@Test
	void 이미_발급된_리포트가_있으면_삭제하고_새_스냅샷으로_대체한다() {
		givenIssuableSession();
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID)).willReturn(Optional.empty());

		sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER);

		verify(sessionReportRepository).deleteBySessionIdAndOrdinaryUserId(SESSION_ID, USER_ID);
		verify(sessionReportRepository).save(any(SessionReport.class));
	}

	@Test
	void 참여_대상_학생이_아니면_400_예외를_던진다() {
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.isParticipantStudent(session, USER_ID)).willReturn(false);

		assertThatThrownBy(() -> sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void 강사가_아니면_403_예외를_던진다() {
		assertThatThrownBy(() -> sessionReportService.createSessionReport(SESSION_ID, request(), STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(sessionReportRepository, never()).save(any(SessionReport.class));
	}

	@Test
	void 로그인하지_않으면_401_예외를_던진다() {
		assertThatThrownBy(() -> sessionReportService.createSessionReport(SESSION_ID, request(), null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void 세션이_없으면_404_예외를_던진다() {
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> sessionReportService.createSessionReport(SESSION_ID, request(), MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void 일괄_발급은_참여_학생_전원에게_정성_항목_없이_발급한다() {
		Long otherStudentId = 8L;
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.resolveStudentIds(session)).willReturn(List.of(USER_ID, otherStudentId));
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID)).willReturn(Optional.empty());
		given(sessionReportRepository.save(any(SessionReport.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SessionReportBulkResponse response = sessionReportService.createSessionReportsForAll(SESSION_ID, MANAGER);

		assertThat(response.sessionId()).isEqualTo(SESSION_ID);
		assertThat(response.issuedCount()).isEqualTo(2);
		verify(sessionReportRepository).deleteBySessionIdAndOrdinaryUserId(SESSION_ID, USER_ID);
		verify(sessionReportRepository).deleteBySessionIdAndOrdinaryUserId(SESSION_ID, otherStudentId);
		ArgumentCaptor<SessionReport> captor = ArgumentCaptor.forClass(SessionReport.class);
		verify(sessionReportRepository, times(2)).save(captor.capture());
		assertThat(captor.getAllValues())
				.extracting(SessionReport::getOrdinaryUserId).containsExactly(USER_ID, otherStudentId);
		assertThat(captor.getAllValues()).allSatisfy(report -> {
			assertThat(report.getQuizRating()).isNull();
			assertThat(report.getAiComment()).isNull();
		});
	}

	@Test
	void 일괄_발급도_강사만_할_수_있다() {
		assertThatThrownBy(() -> sessionReportService.createSessionReportsForAll(SESSION_ID, STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(sessionReportRepository, never()).save(any(SessionReport.class));
	}

	@Test
	void 세션_리포트_명단은_강사만_조회한다() {
		assertThatThrownBy(() -> sessionReportService.listSessionReportRoster(SESSION_ID, STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
		verify(sessionReportRepository, never()).findBySessionIdOrderByIssuedAtDesc(any());
	}

	@Test
	void 세션_리포트_명단을_반환한다() {
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(session.getTitle()).willReturn("React 세션");
		SessionReport report = SessionReport.builder()
				.sessionId(SESSION_ID)
				.ordinaryUserId(USER_ID)
				.quizTotalCount(10)
				.quizAttemptedCount(8)
				.quizCorrectCount(6)
				.quizSkippedCount(1)
				.accuracy(new BigDecimal("75.00"))
				.completionRate(new BigDecimal("80.00"))
				.build();
		given(sessionReportRepository.findBySessionIdOrderByIssuedAtDesc(SESSION_ID)).willReturn(List.of(report));
		User user = mock(User.class);
		given(user.getId()).willReturn(USER_ID);
		given(user.getName()).willReturn("학생A");
		given(userRepository.findAllById(List.of(USER_ID))).willReturn(List.of(user));

		SessionReportRosterResponse response = sessionReportService.listSessionReportRoster(SESSION_ID, MANAGER);

		assertThat(response.sessionId()).isEqualTo(SESSION_ID);
		assertThat(response.sessionTitle()).isEqualTo("React 세션");
		assertThat(response.issuedCount()).isEqualTo(1);
		assertThat(response.reports()).hasSize(1);
		assertThat(response.reports().get(0).ordinaryUserId()).isEqualTo(USER_ID);
		assertThat(response.reports().get(0).userName()).isEqualTo("학생A");
		assertThat(response.reports().get(0).accuracy()).isEqualByComparingTo("75.00");
	}

	private SessionReportCreateRequest request() {
		return new SessionReportCreateRequest(
				USER_ID, new BigDecimal("4.5"), "기초가 탄탄합니다.", List.of("강점"), List.of("보완점"));
	}

	private void givenIssuableSession() {
		given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
		given(participantResolver.isParticipantStudent(session, USER_ID)).willReturn(true);
		given(sessionReportRepository.save(any(SessionReport.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
	}

	/** 생성 중이던 옛 셋은 건너뛰고 최신 완료 셋을 집계 기준으로 잡는지 함께 검증한다. */
	private void givenCompletedQuizSet(List<Quiz> quizzes) {
		Project project = mock(Project.class);
		QuizSet generating = mock(QuizSet.class);
		QuizSet completed = mock(QuizSet.class);
		given(projectRepository.findFirstBySessionIdOrderByIdDesc(SESSION_ID)).willReturn(Optional.of(project));
		given(project.getId()).willReturn(PROJECT_ID);
		given(quizSetRepository.findByProjectIdOrderByIdDesc(PROJECT_ID)).willReturn(List.of(generating, completed));
		given(generating.getStatus()).willReturn(QuizSetStatus.GENERATING);
		given(completed.getStatus()).willReturn(QuizSetStatus.COMPLETED);
		given(completed.getId()).willReturn(QUIZ_SET_ID);
		given(completed.getQuizzes()).willReturn(quizzes);
	}

	private Quiz quiz(QuizDifficulty difficulty, String testedConcept) {
		Quiz quiz = mock(Quiz.class);
		given(quiz.getDifficulty()).willReturn(difficulty);
		given(quiz.getTestedConcept()).willReturn(testedConcept);
		return quiz;
	}

	private QuizProgress attempted(Quiz quiz, boolean correct, long elapsedMs) {
		QuizProgress progress = mock(QuizProgress.class);
		given(progress.getQuiz()).willReturn(quiz);
		given(progress.getStatus()).willReturn(QuizProgressStatus.ATTEMPTED);
		given(progress.getIsCorrect()).willReturn(correct);
		given(progress.getElapsedMs()).willReturn(elapsedMs);
		return progress;
	}

	private QuizProgress skipped(Quiz quiz) {
		QuizProgress progress = mock(QuizProgress.class);
		given(progress.getQuiz()).willReturn(quiz);
		given(progress.getStatus()).willReturn(QuizProgressStatus.SKIPPED);
		given(progress.getIsCorrect()).willReturn(null);
		return progress;
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> asCounts(Object value) {
		return (Map<String, Object>) value;
	}

	private SessionReport capturedReport() {
		ArgumentCaptor<SessionReport> captor = ArgumentCaptor.forClass(SessionReport.class);
		verify(sessionReportRepository).save(captor.capture());
		return captor.getValue();
	}
}
