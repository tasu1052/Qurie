package com.roma.qurie.auth;

import com.roma.qurie.invitation.InvitationTokenProvider;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비밀번호 재설정. 마스터와 매니저/학생 모두 대상이다 — 계정 테이블이 나뉘어 있어 RefreshToken과 같은
 * nullable dual FK(master/user)로 토큰을 관리한다.
 *
 * 토큰 생성·해시는 InvitationTokenProvider를 그대로 재사용한다 — 초대 관련 로직이 없는 범용 컴포넌트다.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Duration EXPIRATION = Duration.ofMinutes(30);

    private final MasterRepository masterRepository;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final InvitationTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailSender mailSender;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * 재설정 요청(1단계). 이메일이 존재하지 않아도 같은 방식으로 조용히 끝낸다 — 계정 존재 여부를
     * 응답 시간·내용으로 추측할 수 없게 하기 위해서다(Invitation의 대상 존재 노출과는 반대 방향 요구사항).
     */
    @Transactional
    public void requestReset(String email) {
        Optional<Master> master = masterRepository.findByEmail(email);
        if (master.isPresent()) {
            issueAndSend(master.get());
            return;
        }
        userRepository.findByEmail(email).ifPresent(this::issueAndSend);
    }

    /**
     * 재설정 확정(2단계). 토큰은 1회용으로 소비하고 비밀번호를 바꾼다.
     * 만료·사용 완료·존재하지 않음을 모두 같은 응답으로 처리해 토큰을 넣어보며 유효성을 추측하지 못하게 한다.
     */
    @Transactional
    public void confirmReset(String rawToken, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenProvider.hash(rawToken))
                .filter(PasswordResetToken::isValid)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "유효하지 않거나 만료된 요청입니다."));

        String encodedPassword = passwordEncoder.encode(newPassword);
        if (token.getMaster() != null) {
            token.getMaster().changePassword(encodedPassword);
        } else {
            token.getUser().changePassword(encodedPassword);
        }
        token.consume();
    }

    private void issueAndSend(Master master) {
        String rawToken = tokenProvider.generateToken();
        passwordResetTokenRepository.save(
                new PasswordResetToken(master, tokenProvider.hash(rawToken), expiresAt()));
        mailSender.send(master.getEmail(), resetUrl(rawToken));
    }

    private void issueAndSend(User user) {
        String rawToken = tokenProvider.generateToken();
        passwordResetTokenRepository.save(
                new PasswordResetToken(user, tokenProvider.hash(rawToken), expiresAt()));
        mailSender.send(user.getEmail(), resetUrl(rawToken));
    }

    private LocalDateTime expiresAt() {
        return LocalDateTime.now().plus(EXPIRATION);
    }

    private String resetUrl(String rawToken) {
        return frontendBaseUrl + "/reset-password?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }
}
