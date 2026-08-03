package com.roma.qurie.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.invitation.InvitationTokenProvider;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.user.entity.User;
import com.roma.qurie.user.entity.UserRole;
import com.roma.qurie.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private MasterRepository masterRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetMailSender mailSender;

    private final InvitationTokenProvider tokenProvider = new InvitationTokenProvider();

    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetService(
                masterRepository, userRepository, passwordResetTokenRepository, tokenProvider,
                passwordEncoder, mailSender);
    }

    @Test
    void requestReset_마스터_이메일이면_토큰을_발급하고_메일을_보낸다() {
        Master master = createMaster();
        when(masterRepository.findByEmail("master@test.com")).thenReturn(Optional.of(master));

        passwordResetService.requestReset("master@test.com");

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getMaster()).isEqualTo(master);
        assertThat(captor.getValue().getUser()).isNull();
        verify(mailSender).send(eq("master@test.com"), anyString());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void requestReset_매니저_학생_이메일이면_토큰을_발급하고_메일을_보낸다() {
        User user = createUser();
        when(masterRepository.findByEmail("manager@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(user));

        passwordResetService.requestReset("manager@test.com");

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getMaster()).isNull();
        verify(mailSender).send(eq("manager@test.com"), anyString());
    }

    @Test
    void requestReset_존재하지_않는_이메일이면_아무일도_하지_않는다() {
        when(masterRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        passwordResetService.requestReset("nobody@test.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(mailSender, never()).send(any(), any());
    }

    @Test
    void confirmReset_유효한_토큰이면_마스터_비밀번호를_변경하고_토큰을_소비한다() {
        Master master = createMaster();
        String rawToken = "raw-token";
        PasswordResetToken token = new PasswordResetToken(
                master, tokenProvider.hash(rawToken), LocalDateTime.now().plusMinutes(30));
        when(passwordResetTokenRepository.findByTokenHash(tokenProvider.hash(rawToken)))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        passwordResetService.confirmReset(rawToken, "new-password");

        assertThat(master.getPassword()).isEqualTo("encoded-new-password");
        assertThat(token.isValid()).isFalse();
    }

    @Test
    void confirmReset_유효한_토큰이면_매니저_학생_비밀번호를_변경한다() {
        User user = createUser();
        String rawToken = "raw-token";
        PasswordResetToken token = new PasswordResetToken(
                user, tokenProvider.hash(rawToken), LocalDateTime.now().plusMinutes(30));
        when(passwordResetTokenRepository.findByTokenHash(tokenProvider.hash(rawToken)))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        passwordResetService.confirmReset(rawToken, "new-password");

        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        assertThat(token.isValid()).isFalse();
    }

    @Test
    void confirmReset_존재하지_않는_토큰이면_예외를_던진다() {
        when(passwordResetTokenRepository.findByTokenHash(tokenProvider.hash("unknown")))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.confirmReset("unknown", "new-password"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getCode()).isEqualTo("INVALID_RESET_TOKEN"));
    }

    @Test
    void confirmReset_만료된_토큰이면_예외를_던진다() {
        Master master = createMaster();
        String rawToken = "expired-token";
        PasswordResetToken token = new PasswordResetToken(
                master, tokenProvider.hash(rawToken), LocalDateTime.now().minusSeconds(1));
        when(passwordResetTokenRepository.findByTokenHash(tokenProvider.hash(rawToken)))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.confirmReset(rawToken, "new-password"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getCode()).isEqualTo("INVALID_RESET_TOKEN"));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void confirmReset_이미_사용된_토큰이면_예외를_던진다() {
        Master master = createMaster();
        String rawToken = "used-token";
        PasswordResetToken token = new PasswordResetToken(
                master, tokenProvider.hash(rawToken), LocalDateTime.now().plusMinutes(30));
        token.consume();
        when(passwordResetTokenRepository.findByTokenHash(tokenProvider.hash(rawToken)))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.confirmReset(rawToken, "new-password"))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getCode()).isEqualTo("INVALID_RESET_TOKEN"));
    }

    private Master createMaster() {
        Enterprise enterprise = new Enterprise("SSAFY 서울캠퍼스");
        ReflectionTestUtils.setField(enterprise, "id", 1L);
        Master master = new Master(enterprise, "master@test.com", "encoded-password", "김대표");
        ReflectionTestUtils.setField(master, "id", 10L);
        return master;
    }

    private User createUser() {
        User user = User.builder()
                .enterpriseId(1L)
                .email("manager@test.com")
                .role(UserRole.MANAGER)
                .password("encoded-password")
                .name("김담당")
                .build();
        ReflectionTestUtils.setField(user, "id", 20L);
        return user;
    }
}
