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
import java.util.List;
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

    /** 같은 계정으로 재요청은 이 시간 안에는 조용히 무시한다 — 이메일 스팸 발송 악용 방지. */
    private static final Duration RESEND_COOLDOWN = Duration.ofMinutes(1);

    private final MasterRepository masterRepository;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final InvitationTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailSender mailSender;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * 재설정 요청(1단계). 이메일이 존재하지 않아도 같은 방식으로 조용히 끝낸다 — 계정 존재 여부를
     * 응답 시간·내용으로 추측할 수 없게 하기 위해서다(Invitation의 대상 존재 노출과는 반대 방향 요구사항).
     * 쿨다운에 걸려도 같은 이유로 에러를 주지 않고 그냥 아무 일도 하지 않는다.
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
     * 비밀번호 유출이 재설정 사유일 수 있으므로, 이미 발급된 리프레시 토큰(로그인 세션)도 함께 폐기한다.
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
            refreshTokenRepository.revokeAllByMasterId(token.getMaster().getId());
        } else {
            token.getUser().changePassword(encodedPassword);
            refreshTokenRepository.revokeAllByUserId(token.getUser().getId());
        }
        token.consume();
    }

    private void issueAndSend(Master master) {
        List<PasswordResetToken> existing =
                passwordResetTokenRepository.findAllByMasterIdAndUsedFalseOrderByCreatedAtDesc(master.getId());
        if (isWithinCooldown(existing)) {
            return;
        }
        existing.forEach(PasswordResetToken::consume);

        String rawToken = tokenProvider.generateToken();
        passwordResetTokenRepository.save(
                new PasswordResetToken(master, tokenProvider.hash(rawToken), expiresAt()));
        mailSender.send(master.getEmail(), resetUrl(rawToken));
    }

    private void issueAndSend(User user) {
        List<PasswordResetToken> existing =
                passwordResetTokenRepository.findAllByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId());
        if (isWithinCooldown(existing)) {
            return;
        }
        existing.forEach(PasswordResetToken::consume);

        String rawToken = tokenProvider.generateToken();
        passwordResetTokenRepository.save(
                new PasswordResetToken(user, tokenProvider.hash(rawToken), expiresAt()));
        mailSender.send(user.getEmail(), resetUrl(rawToken));
    }

    /** 목록은 최신순이라 맨 앞(existing.get(0))이 가장 최근 발급분이다. */
    private boolean isWithinCooldown(List<PasswordResetToken> existingTokensNewestFirst) {
        return !existingTokensNewestFirst.isEmpty()
                && existingTokensNewestFirst.get(0).getCreatedAt().isAfter(LocalDateTime.now().minus(RESEND_COOLDOWN));
    }

    private LocalDateTime expiresAt() {
        return LocalDateTime.now().plus(EXPIRATION);
    }

    private String resetUrl(String rawToken) {
        // 프론트 라우트는 /reset (및 /find-password). /reset-password 는 미등록이라 랜딩으로 떨어졌다.
        return frontendBaseUrl + "/reset?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }
}
