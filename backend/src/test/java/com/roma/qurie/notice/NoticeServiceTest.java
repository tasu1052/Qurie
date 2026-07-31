package com.roma.qurie.notice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.roma.qurie.classes.ClassEntity;
import com.roma.qurie.classes.ClassRepository;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.enterprise.EnterpriseRepository;
import com.roma.qurie.notice.dto.NoticeCreateRequest;
import com.roma.qurie.notice.dto.NoticeDetailResponse;
import com.roma.qurie.notice.dto.NoticeUpdateRequest;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.track.Track;
import com.roma.qurie.track.TrackRepository;
import com.roma.qurie.user.entity.UserRole;

@ExtendWith(MockitoExtension.class)
class NoticeServiceTest {

	private static final Long ENTERPRISE_ID = 1L;
	private static final Long OTHER_ENTERPRISE_ID = 2L;
	private static final Long MASTER_ID = 10L;
	private static final Long TRACK_ID = 20L;
	private static final Long CLASS_ID = 30L;
	private static final Long NOTICE_ID = 40L;

	@Mock
	private NoticeRepository noticeRepository;

	@Mock
	private EnterpriseRepository enterpriseRepository;

	@Mock
	private TrackRepository trackRepository;

	@Mock
	private ClassRepository classRepository;

	@InjectMocks
	private NoticeService noticeService;

	@Test
	void createSavesEnterpriseScopedNoticeForMaster() {
		given(enterpriseRepository.findById(ENTERPRISE_ID)).willReturn(Optional.of(enterprise(ENTERPRISE_ID)));
		given(noticeRepository.save(any(Notice.class))).willAnswer(invocation -> invocation.getArgument(0));

		NoticeDetailResponse response = noticeService.create(masterOf(ENTERPRISE_ID), createRequest());

		ArgumentCaptor<Notice> captor = ArgumentCaptor.forClass(Notice.class);
		verify(noticeRepository).save(captor.capture());
		assertThat(captor.getValue().getCreatedBy()).isEqualTo(MASTER_ID);
		assertThat(captor.getValue().getCreatedByType()).isEqualTo(NoticeAuthorType.MASTER);
		assertThat(response.title()).isEqualTo("점검 안내");
		assertThat(response.scope()).isEqualTo(NoticeScope.ENTERPRISE);
	}

	@Test
	void createThrowsForbiddenWhenTrackBelongsToAnotherEnterprise() {
		given(trackRepository.findById(TRACK_ID)).willReturn(Optional.of(track(OTHER_ENTERPRISE_ID)));

		assertThatThrownBy(() -> noticeService.create(masterOf(ENTERPRISE_ID), trackScopedRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(noticeRepository, never()).save(any());
	}

	@Test
	void createThrowsForbiddenWhenClassBelongsToAnotherEnterprise() {
		given(classRepository.findById(CLASS_ID)).willReturn(Optional.of(classEntity(OTHER_ENTERPRISE_ID)));

		assertThatThrownBy(() -> noticeService.create(masterOf(ENTERPRISE_ID), classScopedRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(noticeRepository, never()).save(any());
	}

	@Test
	void createThrowsForbiddenWhenRequesterIsNotMaster() {
		AuthUser manager = new AuthUser(
				11L, UserRole.MANAGER.name(), ENTERPRISE_ID, "manager@qurie.com", "매니저", CLASS_ID);

		assertThatThrownBy(() -> noticeService.create(manager, createRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void createThrowsUnauthorizedWhenNotAuthenticated() {
		assertThatThrownBy(() -> noticeService.create(null, createRequest()))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void updateAppliesOnlyProvidedFields() {
		Notice notice = notice(ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));

		NoticeDetailResponse response = noticeService.update(
				masterOf(ENTERPRISE_ID), NOTICE_ID, new NoticeUpdateRequest("새 제목", null, true));

		assertThat(response.title()).isEqualTo("새 제목");
		assertThat(response.body()).isEqualTo("원래 본문");
		assertThat(response.pinned()).isTrue();
	}

	@Test
	void updateThrowsBadRequestWhenNoFieldsProvided() {
		Notice notice = notice(ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));

		assertThatThrownBy(() -> noticeService.update(
				masterOf(ENTERPRISE_ID), NOTICE_ID, new NoticeUpdateRequest(null, null, null)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void updateThrowsForbiddenWhenRequesterIsNeitherAuthorNorMaster() {
		Notice notice = notice(ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));
		AuthUser otherManager = new AuthUser(
				99L, UserRole.MANAGER.name(), ENTERPRISE_ID, "manager2@qurie.com", "다른매니저", CLASS_ID);

		assertThatThrownBy(() -> noticeService.update(
				otherManager, NOTICE_ID, new NoticeUpdateRequest("새 제목", null, null)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void updateThrowsNotFoundWhenNoticeBelongsToAnotherEnterprise() {
		Notice notice = notice(OTHER_ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));

		assertThatThrownBy(() -> noticeService.update(
				masterOf(ENTERPRISE_ID), NOTICE_ID, new NoticeUpdateRequest("새 제목", null, null)))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.NOT_FOUND);
	}

	@Test
	void deleteRemovesNoticeWhenRequesterIsMaster() {
		Notice notice = notice(ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));

		noticeService.delete(masterOf(ENTERPRISE_ID), NOTICE_ID);

		verify(noticeRepository).delete(notice);
	}

	@Test
	void deleteThrowsForbiddenWhenRequesterIsNeitherAuthorNorMaster() {
		Notice notice = notice(ENTERPRISE_ID, MASTER_ID, NoticeAuthorType.MASTER);
		given(noticeRepository.findById(NOTICE_ID)).willReturn(Optional.of(notice));
		AuthUser student = new AuthUser(
				12L, UserRole.STUDENT.name(), ENTERPRISE_ID, "student@qurie.com", "학생", CLASS_ID);

		assertThatThrownBy(() -> noticeService.delete(student, NOTICE_ID))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(NoticeServiceTest::statusOf)
				.isEqualTo(HttpStatus.FORBIDDEN);

		verify(noticeRepository, never()).delete(any(Notice.class));
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException) throwable).getStatusCode();
	}

	private AuthUser masterOf(Long enterpriseId) {
		return new AuthUser(MASTER_ID, "MASTER", enterpriseId, "master@qurie.com", "마스터", null);
	}

	private NoticeCreateRequest createRequest() {
		return new NoticeCreateRequest(NoticeScope.ENTERPRISE, null, null, "점검 안내", "오늘 밤 점검합니다.", false);
	}

	private NoticeCreateRequest trackScopedRequest() {
		return new NoticeCreateRequest(NoticeScope.TRACK, TRACK_ID, null, "트랙 공지", "본문", false);
	}

	private NoticeCreateRequest classScopedRequest() {
		return new NoticeCreateRequest(NoticeScope.CLASS, null, CLASS_ID, "반 공지", "본문", false);
	}

	private Enterprise enterprise(Long id) {
		Enterprise enterprise = new Enterprise("SSAFY");
		ReflectionTestUtils.setField(enterprise, "id", id);
		return enterprise;
	}

	private Track track(Long enterpriseId) {
		Track track = new Track(enterprise(enterpriseId), "Java 트랙", null, "JAVA");
		ReflectionTestUtils.setField(track, "id", TRACK_ID);
		return track;
	}

	private ClassEntity classEntity(Long enterpriseId) {
		ClassEntity classEntity = ClassEntity.builder()
				.track(track(enterpriseId))
				.classNumber(1)
				.name("서울 1반")
				.build();
		ReflectionTestUtils.setField(classEntity, "id", CLASS_ID);
		return classEntity;
	}

	private Notice notice(Long enterpriseId, Long createdBy, NoticeAuthorType createdByType) {
		Notice notice = Notice.builder()
				.enterprise(enterprise(enterpriseId))
				.scope(NoticeScope.ENTERPRISE)
				.title("원래 제목")
				.body("원래 본문")
				.pinned(false)
				.createdBy(createdBy)
				.createdByType(createdByType)
				.build();
		ReflectionTestUtils.setField(notice, "id", NOTICE_ID);
		return notice;
	}
}
