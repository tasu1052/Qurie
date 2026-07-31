package com.roma.qurie.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.roma.qurie.analytics.dto.ClassAnalyticsResponse;
import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.classes.ClassUserRepository;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.group.GroupRepository;
import com.roma.qurie.report.repository.UserReportRepository;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.session.core.SessionRepository;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

	private static final Long ENTERPRISE_ID = 100L;
	private static final Long CLASS_ID = 7L;
	private static final AuthUser MASTER =
			new AuthUser(1L, "MASTER", ENTERPRISE_ID, "master@qurie.com", "마스터", null);
	private static final AuthUser MANAGER =
			new AuthUser(2L, "MANAGER", ENTERPRISE_ID, "manager@qurie.com", "매니저", CLASS_ID);
	private static final AuthUser STUDENT =
			new AuthUser(3L, "STUDENT", ENTERPRISE_ID, "student@qurie.com", "학생", CLASS_ID);

	@Mock
	private TrackRepository trackRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private ClassUserRepository classUserRepository;

	@Mock
	private GroupRepository groupRepository;

	@Mock
	private SessionRepository sessionRepository;

	@Mock
	private UserReportRepository userReportRepository;

	@InjectMocks
	private AnalyticsService analyticsService;

	@Test
	void classAnalyticsAggregatesCountsAndReportAverages() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(ENTERPRISE_ID)));
		given(classUserRepository.countByClassEntityIdAndUserRole(CLASS_ID, UserRole.STUDENT)).willReturn(18L);
		given(classUserRepository.countByClassEntityIdAndUserRole(CLASS_ID, UserRole.MANAGER)).willReturn(1L);
		given(groupRepository.countByClassId(CLASS_ID)).willReturn(4L);
		given(sessionRepository.countByClassId(CLASS_ID)).willReturn(9L);
		given(sessionRepository.countByClassIdAndActive(CLASS_ID, true)).willReturn(2L);
		given(userReportRepository.summarizeByClassId(CLASS_ID)).willReturn(summary(12L, 73.5, 88.0, 4200.4));

		ClassAnalyticsResponse response = analyticsService.getClassAnalytics(CLASS_ID, MASTER);

		assertThat(response.studentCount()).isEqualTo(18L);
		assertThat(response.managerCount()).isEqualTo(1L);
		assertThat(response.groupCount()).isEqualTo(4L);
		assertThat(response.sessionCount()).isEqualTo(9L);
		assertThat(response.activeSessionCount()).isEqualTo(2L);
		assertThat(response.reportedStudentCount()).isEqualTo(12L);
		assertThat(response.avgAccuracy()).isEqualTo(73.5);
		assertThat(response.avgElapsedMs()).isEqualTo(4200);
	}

	/** 리포트가 없으면 평균은 null 이어야 한다 — 0 으로 내리면 "정답률 0%"로 읽힌다. */
	@Test
	void classAnalyticsKeepsAveragesNullWhenNoReports() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(ENTERPRISE_ID)));
		given(userReportRepository.summarizeByClassId(CLASS_ID)).willReturn(summary(0L, null, null, null));

		ClassAnalyticsResponse response = analyticsService.getClassAnalytics(CLASS_ID, MASTER);

		assertThat(response.reportedStudentCount()).isZero();
		assertThat(response.avgAccuracy()).isNull();
		assertThat(response.avgCompletionRate()).isNull();
		assertThat(response.avgElapsedMs()).isNull();
	}

	@Test
	void managerOfClassCanReadClassAnalytics() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(ENTERPRISE_ID)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, MANAGER.id())).willReturn(true);
		given(userReportRepository.summarizeByClassId(CLASS_ID)).willReturn(summary(0L, null, null, null));

		assertThat(analyticsService.getClassAnalytics(CLASS_ID, MANAGER).classId()).isEqualTo(CLASS_ID);
	}

	@Test
	void managerOfAnotherClassCannotReadClassAnalytics() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(ENTERPRISE_ID)));
		given(classUserRepository.existsByClassEntityIdAndUserId(CLASS_ID, MANAGER.id())).willReturn(false);

		assertThatThrownBy(() -> analyticsService.getClassAnalytics(CLASS_ID, MANAGER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void studentCannotReadClassAnalytics() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(ENTERPRISE_ID)));

		assertThatThrownBy(() -> analyticsService.getClassAnalytics(CLASS_ID, STUDENT))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void masterOfAnotherEnterpriseCannotReadClassAnalytics() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(999L)));

		assertThatThrownBy(() -> analyticsService.getClassAnalytics(CLASS_ID, MASTER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void classAnalyticsThrowsNotFoundForMissingClass() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.empty());

		assertThatThrownBy(() -> analyticsService.getClassAnalytics(CLASS_ID, MASTER))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(exception -> ((ResponseStatusException)exception).getStatusCode())
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	private ClassEntity classEntity(Long enterpriseId) {
		Enterprise enterprise = new Enterprise("SSAFY");
		ReflectionTestUtils.setField(enterprise, "id", enterpriseId);
		ClassEntity classEntity = ClassEntity.builder()
				.track(new Track(enterprise, "Java 트랙", null, "JAVA"))
				.classNumber(1)
				.name("서울 1반")
				.build();
		ReflectionTestUtils.setField(classEntity, "id", CLASS_ID);
		return classEntity;
	}

	private UserReportRepository.ClassReportSummary summary(
			long reportedStudentCount, Double accuracy, Double completionRate, Double elapsedMs) {
		return new UserReportRepository.ClassReportSummary() {

			@Override
			public long getReportedStudentCount() {
				return reportedStudentCount;
			}

			@Override
			public Double getAvgAccuracy() {
				return accuracy;
			}

			@Override
			public Double getAvgCompletionRate() {
				return completionRate;
			}

			@Override
			public Double getAvgElapsedMs() {
				return elapsedMs;
			}
		};
	}
}
