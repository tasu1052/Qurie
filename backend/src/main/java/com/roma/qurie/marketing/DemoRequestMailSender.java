package com.roma.qurie.marketing;

import com.roma.qurie.marketing.dto.DemoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * 도입 문의 메일 발송. SMTP 미설정 환경에서는 PasswordResetMailSender 와 같이 로그만 남기고 건너뛴다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoRequestMailSender {

	private final ObjectProvider<JavaMailSender> mailSenderProvider;

	@Value("${app.mail.from:no-reply@qurie.com}")
	private String from;

	@Value("${app.demo.mail.to:}")
	private String to;

	public void send(DemoRequest request) {
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			log.warn("SMTP 설정이 없어 도입 문의 메일을 보내지 않았습니다. email={}", request.workEmail());
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "메일 서버가 설정되지 않아 문의를 접수할 수 없습니다.");
		}

		String recipient = (to == null || to.isBlank()) ? from : to.trim();

		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(recipient);
		message.setReplyTo(request.workEmail());
		message.setSubject("[Qurie] 도입 문의 — " + request.company());
		message.setText(body(request));

		try {
			mailSender.send(message);
		} catch (MailException e) {
			log.error("도입 문의 메일 발송에 실패했습니다. email={}", request.workEmail(), e);
			throw e;
		}
	}

	private String body(DemoRequest request) {
		String useCases = String.join(", ", request.useCases());
		String other = request.otherDetail() == null || request.otherDetail().isBlank()
				? "(없음)"
				: request.otherDetail().trim();
		return """
				도입 문의가 접수되었습니다.

				이름: %s %s
				업무용 이메일: %s
				회사: %s
				직위: %s
				전화: %s
				사용 목적: %s
				기타: %s
				""".formatted(
				request.lastName().trim(),
				request.firstName().trim(),
				request.workEmail().trim(),
				request.company().trim(),
				request.title().trim(),
				request.phone().trim(),
				useCases,
				other);
	}
}
