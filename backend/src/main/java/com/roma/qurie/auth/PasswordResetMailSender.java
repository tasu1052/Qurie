package com.roma.qurie.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * 비밀번호 재설정 메일 발송.
 *
 * JavaMailSender 를 ObjectProvider 로 받는 이유는 spring.mail.host 가 없으면 그 빈이 아예 만들어지지 않기 때문이다.
 * SMTP 를 설정하지 않은 환경에서도 재설정 요청 자체는 조용히 건너뛴다(존재 여부를 노출하지 않는 정책과 같은 이유로,
 * 메일 실패를 호출부에 알리지 않는다).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetMailSender {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:no-reply@qurie.com}")
    private String from;

    public void send(String email, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("SMTP 설정이 없어 비밀번호 재설정 메일을 보내지 않았습니다. email={}", email);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("[Qurie] 비밀번호 재설정");
        message.setText(body(resetUrl));

        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.error("비밀번호 재설정 메일 발송에 실패했습니다. email={}", email, e);
        }
    }

    private String body(String resetUrl) {
        return """
                비밀번호 재설정을 요청하셨습니다.

                아래 링크에서 새 비밀번호를 설정해 주세요.
                %s

                이 링크는 30분 동안 유효합니다.
                본인이 요청하지 않았다면 이 메일을 무시하세요.
                """.formatted(resetUrl);
    }
}
