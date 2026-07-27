package com.roma.qurie.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.roma.qurie.auth.dto.LoginRequest;
import com.roma.qurie.enterprise.Enterprise;
import com.roma.qurie.master.Master;
import com.roma.qurie.master.MasterRepository;
import com.roma.qurie.security.JwtTokenProvider;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String SECRET = "test-only-secret-key-must-be-at-least-32-bytes-long!!";

    @Mock
    private MasterRepository masterRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(masterRepository, passwordEncoder, new JwtTokenProvider(SECRET));
    }

    @Test
    void login_성공하면_액세스토큰과_사용자정보를_반환한다() {
        Master master = createMaster();
        when(masterRepository.findByEmail("master@test.com")).thenReturn(Optional.of(master));
        when(passwordEncoder.matches("plain-password", "encoded-password")).thenReturn(true);

        AuthResult result = authService.login(new LoginRequest("master@test.com", "plain-password"));

        assertThat(result.accessToken()).isNotBlank();
        assertThat(result.user().id()).isEqualTo(10L);
        assertThat(result.user().role()).isEqualTo("MASTER");
        assertThat(result.user().enterpriseId()).isEqualTo(1L);
        assertThat(result.user().email()).isEqualTo("master@test.com");
    }

    @Test
    void login_비밀번호가_틀리면_401을_던진다() {
        Master master = createMaster();
        when(masterRepository.findByEmail("master@test.com")).thenReturn(Optional.of(master));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("master@test.com", "wrong-password")))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED))
                .satisfies(e -> assertThat(((AuthException) e).getCode()).isEqualTo("INVALID_CREDENTIALS"));
    }

    @Test
    void login_존재하지_않는_이메일이면_401을_던진다() {
        when(masterRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@test.com", "whatever")))
                .isInstanceOf(AuthException.class)
                .satisfies(e -> assertThat(((AuthException) e).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    private Master createMaster() {
        Enterprise enterprise = new Enterprise("SSAFY 서울캠퍼스");
        ReflectionTestUtils.setField(enterprise, "id", 1L);
        Master master = new Master(enterprise, "master@test.com", "encoded-password", "김대표");
        ReflectionTestUtils.setField(master, "id", 10L);
        return master;
    }
}
