package com.roma.qurie.invitation.dto;

import com.roma.qurie.user.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 초대 생성 요청. 초대하는 쪽(마스터/매니저)이 대상의 이메일과 배정할 반을 지정한다.
 */
public record InvitationCreateRequest(
		@NotBlank @Email @Size(max = 255) String email,
		@NotNull Long classId,
		@NotNull UserRole role) {
}
