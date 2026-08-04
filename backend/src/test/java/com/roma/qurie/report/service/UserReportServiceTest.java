package com.roma.qurie.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.report.dto.UserReportCreateRequest;
import com.roma.qurie.report.dto.UserReportDetailResponse;
import com.roma.qurie.report.entity.SessionReport;
import com.roma.qurie.report.entity.UserReport;
import com.roma.qurie.report.repository.SessionReportRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserReportServiceTest {

	private static final Long USER_ID = 7L;
	private static final Long CLASS_ID = 3L;
	private static final AuthUser MANAGER =
			new AuthUser(10L, "MANAGER", 100L, "manager@qurie.com", "매니저", CLASS_ID);
	private static final AuthUser OTHER_STUDENT =
			new AuthUser(20L, "STUDENT", 100L, "other@qurie.com", "다른 학생", CLASS_ID);

	@Mock
	private UserReportRepository userReportRepository;

	@Mock
	private SessionReportRepository sessionReportRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private UserReportService userReportService;

	/** 5문항 100% + 20문항 50% 는 평균의 평균(75%)이 아니라 합산(15/25 = 60%)이어야 한다. */
	@Test
	void 세션_리포트를_개수_기준으로_합산한다() {
		givenIssuableUser();
		SessionReport small = sessionReport(5, 5, 5, 0, 10_000,
				Map.of("EASY", counts(5, 5, 5)), Map.of("JPA", counts(5, 5, 5)));
		SessionReport large = sessionReport(20, 20, 10, 0, 4_000,
				Map.of("EASY", counts(10, 10, 5), "HARD", counts(10, 10, 5)), null);
		given(sessionReportRepository.findAllByClassIdAndOrdinaryUserId(CLASS_ID, USER_ID))
				.willReturn(List.of(small, large));

		userReportService.createUserReport(USER_ID, request());

		UserReport saved = capturedReport();
		assertThat(saved.getSessionCount()).isEqualTo(2);
		assertThat(saved.getQuizTotalCount()).isEqualTo(25);
		assertThat(saved.getQuizAttemptedCount()).isEqualTo(25);
		assertThat(saved.getQuizCorrectCount()).isEqualTo(15);
		assertThat(saved.getCompletionRate()).isEqualByComparingTo("100.00");
		assertThat(saved.getAccuracy()).isEqualByComparingTo("60.00");
		assertThat(saved.getAvgElapsedMs()).isEqualTo(5_200);
		assertThat(saved.getRating()).isEqualByComparingTo("4.5");

		assertThat(saved.getDifficultyRatio()).containsOnlyKeys("EASY", "HARD");
		assertThat(asCounts(saved.getDifficultyRatio().get("EASY")))
				.containsEntry("total", 15).containsEntry("attempted", 15).containsEntry("correct", 10);
		assertThat(asCounts(saved.getDifficultyRatio().get("HARD")))
				.containsEntry("total", 10).containsEntry("attempted", 10).containsEntry("correct", 5);
		assertThat(saved.getConceptStats()).containsOnlyKeys("JPA");
	}

	@Test
	void 세션_리포트가_없으면_지표_0건으로_발급한다() {
		givenIssuableUser();
		given(sessionReportRepository.findAllByClassIdAndOrdinaryUserId(CLASS_ID, USER_ID))
				.willReturn(List.of());

		userReportService.createUserReport(USER_ID, request());

		UserReport saved = capturedReport();
		assertThat(saved.getSessionCount()).isZero();
		assertThat(saved.getQuizTotalCount()).isZero();
		assertThat(saved.getCompletionRate()).isNull();
		assertThat(saved.getAccuracy()).isNull();
		assertThat(saved.getAvgElapsedMs()).isNull();
		assertThat(saved.getDifficultyRatio()).isEmpty();
		assertThat(saved.getConceptStats()).isEmpty();
	}

	@Test
	void 반_명단에_없는_사용자면_400_예외를_던진다() {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, USER_ID)).willReturn(false);

		assertThatThrownBy(() -> userReportService.createUserReport(USER_ID, request()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void 이미_발급된_최종_리포트가_있으면_409_예외를_던진다() {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, USER_ID)).willReturn(true);
		given(userReportRepository.existsByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID)).willReturn(true);

		assertThatThrownBy(() -> userReportService.createUserReport(USER_ID, request()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.CONFLICT);
	}

	@Test
	void 매니저는_학생의_최종_리포트를_조회할_수_있다() {
		UserReport report = UserReport.builder()
				.ordinaryUserId(USER_ID)
				.classId(CLASS_ID)
				.sessionCount(2)
				.quizTotalCount(25)
				.quizAttemptedCount(25)
				.quizCorrectCount(15)
				.quizSkippedCount(0)
				.accuracy(new BigDecimal("60.00"))
				.build();
		given(userReportRepository.findByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID))
				.willReturn(Optional.of(report));
		User user = Mockito.mock(User.class);
		given(user.getName()).willReturn("김학생");
		given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));

		UserReportDetailResponse response = userReportService.getUserReport(USER_ID, CLASS_ID, MANAGER);

		assertThat(response.userName()).isEqualTo("김학생");
		assertThat(response.sessionCount()).isEqualTo(2);
		assertThat(response.accuracy()).isEqualByComparingTo(new BigDecimal("60.00"));
	}

	@Test
	void 다른_학생의_최종_리포트_조회는_403_예외를_던진다() {
		assertThatThrownBy(() -> userReportService.getUserReport(USER_ID, CLASS_ID, OTHER_STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void 발급된_최종_리포트가_없으면_404_예외를_던진다() {
		given(userReportRepository.findByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID))
				.willReturn(Optional.empty());

		assertThatThrownBy(() -> userReportService.getUserReport(USER_ID, CLASS_ID, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void 로그인하지_않은_조회는_401_예외를_던진다() {
		assertThatThrownBy(() -> userReportService.getUserReport(USER_ID, CLASS_ID, null))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException) exception).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	private UserReportCreateRequest request() {
		return new UserReportCreateRequest(CLASS_ID, new BigDecimal("4.5"), "v0.1");
	}

	private void givenIssuableUser() {
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, USER_ID)).willReturn(true);
		given(userReportRepository.existsByOrdinaryUserIdAndClassId(USER_ID, CLASS_ID)).willReturn(false);
		given(userReportRepository.save(any(UserReport.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
	}

	private SessionReport sessionReport(int total, int attempted, int correct, int skipped, Integer avgElapsedMs,
			Map<String, Object> difficultyRatio, Map<String, Object> conceptStats) {
		return SessionReport.builder()
				.sessionId(1L)
				.ordinaryUserId(USER_ID)
				.quizTotalCount(total)
				.quizAttemptedCount(attempted)
				.quizCorrectCount(correct)
				.quizSkippedCount(skipped)
				.avgElapsedMs(avgElapsedMs)
				.difficultyRatio(difficultyRatio)
				.conceptStats(conceptStats)
				.build();
	}

	private Map<String, Object> counts(int total, int attempted, int correct) {
		return Map.of("total", total, "attempted", attempted, "correct", correct);
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> asCounts(Object value) {
		return (Map<String, Object>) value;
	}

	private UserReport capturedReport() {
		ArgumentCaptor<UserReport> captor = ArgumentCaptor.forClass(UserReport.class);
		verify(userReportRepository).save(captor.capture());
		return captor.getValue();
	}
}
