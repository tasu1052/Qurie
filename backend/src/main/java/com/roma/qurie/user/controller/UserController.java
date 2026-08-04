package com.roma.qurie.user.controller;

import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.common.dto.PageResponse;
import com.roma.qurie.report.dto.SessionReportSummaryResponse;
import com.roma.qurie.report.dto.UserReportCreateRequest;
import com.roma.qurie.report.dto.UserReportCreateResponse;
import com.roma.qurie.report.dto.UserReportDetailResponse;
import com.roma.qurie.report.service.SessionReportService;
import com.roma.qurie.report.service.UserReportService;
import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.dto.UserProfileResponse;
import com.roma.qurie.user.dto.UserProfileUpdateRequest;
import com.roma.qurie.user.dto.UserSignUpRequest;
import com.roma.qurie.user.dto.UserSignUpResponse;
import com.roma.qurie.user.dto.UserSummaryResponse;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;
	private final UserReportService userReportService;
	private final SessionReportService sessionReportService;

	/**
	 * 매니저/학생 회원가입. API 설계의 UserController 표에는 조회·수정·삭제만 있어 생성 경로는
	 * 컬렉션 리소스에 대한 POST 로 둔다.
	 *
	 * @param request: 소속 기업 id, 이메일, 비밀번호, 이름, 역할
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UserSignUpResponse signUp(@Valid @RequestBody UserSignUpRequest request) {
		return userService.signUp(request);
	}

	/**
	 * 회원 목록 조회 (MASTER). 마스터 대시보드의 매니저 활동 카드는 role=MANAGER, size=3 으로 상위 N명만 잘라 쓴다.
	 *
	 * todo: 정렬은 활동량(최근 7일 세션 운영 횟수) desc 로 고정되어 있다. 회원 관리 화면(1g)에서
	 *       다른 정렬 기준이 필요해지면 sort 파라미터를 받도록 확장해야 한다.
	 *
	 * @param role: MANAGER 또는 STUDENT. 없으면 전체
	 * @param keyword: 이름 또는 이메일 부분 검색
	 */
	@GetMapping
	public PageResponse<UserSummaryResponse> getUsers(@AuthenticationPrincipal AuthUser requester,
			@RequestParam(name = "role", required = false) UserRole role,
			@RequestParam(name = "q", required = false) String keyword,
			@PageableDefault(size = 20) Pageable pageable) {
		return userService.getUserSummaries(requester, role, keyword, pageable);
	}

	/**
	 * 마이페이지 조회. 수정 화면에 현재 값을 채우기 위해 필요하다.
	 */
	@GetMapping("/{userId}")
	public UserProfileResponse getProfile(@PathVariable("userId") Long userId,
			@AuthenticationPrincipal AuthUser requester) {
		return userService.getProfile(userId, requester);
	}

	/**
	 * 마이페이지 정보 수정.
	 *
	 * @param request: 이름, 현재 비밀번호, 새 비밀번호 (보낸 항목만 반영)
	 */
	@PatchMapping("/{userId}")
	public UserProfileResponse updateProfile(@PathVariable("userId") Long userId,
			@Valid @RequestBody UserProfileUpdateRequest request,
			@AuthenticationPrincipal AuthUser requester) {
		return userService.updateProfile(userId, request, requester);
	}

	/**
	 * 사용자 최종 리포트 발급. /users 리소스 하위 경로라 세션 리포트(SessionController)와 같은 방식으로
	 * 리소스 소유 컨트롤러에 둔다 — 별도 UserReportController 로 빼면 /api/v1 처럼 prefix 가 어긋난다.
	 * 정량 지표는 서버가 그 반의 세션 리포트들을 합산해 계산한다.
	 *
	 * @param ordinaryUserId: 최종 리포트를 발급할 사용자 id
	 * @param request: 클래스 id와 평점(공식 미확정이라 전달값 저장)
	 */
	@PostMapping("/{userId}/report-summary")
	@ResponseStatus(HttpStatus.CREATED)
	public UserReportCreateResponse createUserReport(@PathVariable("userId") Long ordinaryUserId,
			@Valid @RequestBody UserReportCreateRequest request) {
		return userReportService.createUserReport(ordinaryUserId, request);
	}

	/**
	 * 사용자 최종 리포트 조회. 본인 또는 매니저/마스터만 볼 수 있다.
	 *
	 * @param ordinaryUserId: 리포트 대상 사용자 id
	 * @param classId: 리포트가 발급된 클래스 id
	 */
	@GetMapping("/{userId}/report-summary")
	public UserReportDetailResponse getUserReport(@PathVariable("userId") Long ordinaryUserId,
			@RequestParam("classId") Long classId,
			@AuthenticationPrincipal AuthUser requester) {
		return userReportService.getUserReport(ordinaryUserId, classId, requester);
	}

	/** 종합 리포트 화면의 세션 리포트 목록. */
	@GetMapping("/{userId}/session-reports")
	public List<SessionReportSummaryResponse> listSessionReports(
			@PathVariable("userId") Long ordinaryUserId,
			@AuthenticationPrincipal AuthUser requester) {
		return sessionReportService.listSessionReports(ordinaryUserId, requester);
	}
}
