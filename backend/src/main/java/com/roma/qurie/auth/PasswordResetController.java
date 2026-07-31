package com.roma.qurie.auth;

import com.roma.qurie.auth.dto.PasswordResetConfirmRequest;
import com.roma.qurie.auth.dto.PasswordResetRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /** 재설정 메일 발송 요청. 이메일 존재 여부와 무관하게 항상 204를 반환한다. */
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void request(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
    }

    /** 메일로 받은 토큰과 새 비밀번호로 재설정을 확정한다. */
    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirmReset(request.token(), request.newPassword());
    }
}
