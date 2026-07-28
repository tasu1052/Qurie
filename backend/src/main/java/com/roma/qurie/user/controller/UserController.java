package com.roma.qurie.user.controller;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.roma.qurie.security.AuthUser;
import com.roma.qurie.user.dto.UserProfileResponse;
import com.roma.qurie.user.dto.UserProfileUpdateRequest;
import com.roma.qurie.user.dto.UserSignUpRequest;
import com.roma.qurie.user.dto.UserSignUpResponse;
import com.roma.qurie.user.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

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
}
