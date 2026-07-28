package com.roma.qurie.invitation;

import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * 초대 메일 발송.
 *
 * JavaMailSender 를 ObjectProvider 로 받는 이유는 spring.mail.host 가 없으면 그 빈이 아예 만들어지지 않기 때문이다.
 * SMTP 를 설정하지 않은 로컬에서도 애플리케이션이 뜨고 초대는 정상 생성되며, 메일만 건너뛴다
 * (링크는 초대 생성 응답의 signUpUrl 로 나가므로 수동 전달이 가능하다).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvitationMailSender {

	private static final DateTimeFormatter EXPIRES_AT_FORMAT =
			DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

	private final ObjectProvider<JavaMailSender> mailSenderProvider;

	@Value("${app.mail.from:no-reply@qurie.com}")
	private String from;

	public void send(Invitation invitation, String signUpUrl) {
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			log.warn("SMTP 설정이 없어 초대 메일을 보내지 않았습니다. 응답의 signUpUrl 을 직접 전달하세요. email={}",
					invitation.getEmail());
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(invitation.getEmail());
		message.setSubject(subject(invitation));
		message.setText(body(invitation, signUpUrl));

		try {
			mailSender.send(message);
		} catch (MailException e) {
			/*
			 * 메일 실패로 초대까지 되돌리면 다시 발급하는 것 외에 방법이 없다.
			 * 링크는 이미 응답에 담겨 나가므로 초대는 살려두고 실패만 남긴다.
			 */
			log.error("초대 메일 발송에 실패했습니다. email={}", invitation.getEmail(), e);
		}
	}

	private String subject(Invitation invitation) {
		return "[Qurie] " + invitation.getClassEntity().getName() + " 참여 초대";
	}

	private String body(Invitation invitation, String signUpUrl) {
		return """
				%s 에 %s(으)로 초대되었습니다.

				아래 링크에서 회원가입을 완료해 주세요.
				%s

				이 링크는 %s 까지 유효합니다.
				본인이 요청한 초대가 아니라면 이 메일을 무시하세요.
				""".formatted(
				invitation.getClassEntity().getName(),
				roleLabel(invitation),
				signUpUrl,
				invitation.getExpiresAt().format(EXPIRES_AT_FORMAT));
	}

	private String roleLabel(Invitation invitation) {
		return switch (invitation.getRole()) {
			case MANAGER -> "매니저";
			case STUDENT -> "학생";
		};
	}
}
