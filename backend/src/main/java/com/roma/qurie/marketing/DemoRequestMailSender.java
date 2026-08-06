package com.roma.qurie.marketing;

import com.roma.qurie.marketing.dto.DemoRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * 도입 문의 메일 발송.
 * SMTP 미설정·수신처 미설정이면 502 로 실패를 드러내 조용히 유실되지 않게 한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoRequestMailSender {

	private static final Map<String, String> USE_CASE_LABELS = new LinkedHashMap<>();

	static {
		USE_CASE_LABELS.put("bootcamp", "부트캠프·교육 과정 운영");
		USE_CASE_LABELS.put("onboarding", "사내 개발자 온보딩");
		USE_CASE_LABELS.put("assessment", "코딩 평가·이해도 측정");
		USE_CASE_LABELS.put("collab", "실시간 페어 프로그래밍 수업");
		USE_CASE_LABELS.put("other", "기타");
	}

	private final ObjectProvider<JavaMailSender> mailSenderProvider;

	@Value("${app.mail.from:no-reply@qurie.com}")
	private String from;

	/** 도입 문의 수신함. 비어 있으면 spring.mail.username 으로 폴백. */
	@Value("${app.demo.mail.to:}")
	private String to;

	@Value("${spring.mail.username:}")
	private String mailUsername;

	public void send(DemoRequest request) {
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			log.warn("SMTP 설정이 없어 도입 문의 메일을 보내지 않았습니다. email={}", request.workEmail());
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY, "메일 서버가 설정되지 않아 문의를 접수할 수 없습니다.");
		}

		String recipient = resolveRecipient();

		try {
			MimeMessage mimeMessage = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
			helper.setFrom(from);
			helper.setTo(recipient);
			helper.setReplyTo(request.workEmail().trim());
			helper.setSubject("[Qurie] 도입 문의 — " + request.company().trim());
			helper.setText(body(request), false);
			mailSender.send(mimeMessage);
			log.info("도입 문의 메일을 발송했습니다. to={}, fromEmail={}", recipient, request.workEmail());
		} catch (MessagingException | MailException e) {
			log.error(
					"도입 문의 메일 발송에 실패했습니다. to={}, email={}",
					recipient,
					request.workEmail(),
					e);
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY, "문의 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", e);
		}
	}

	private String resolveRecipient() {
		if (to != null && !to.isBlank()) {
			return to.trim();
		}
		if (mailUsername != null && !mailUsername.isBlank()) {
			log.warn("DEMO_MAIL_TO 가 비어 있어 SMTP 계정({}) 로 도입 문의를 보냅니다. username={}", mailUsername);
			return mailUsername.trim();
		}
		throw new ResponseStatusException(
				HttpStatus.BAD_GATEWAY, "도입 문의 수신 메일(DEMO_MAIL_TO)이 설정되지 않았습니다.");
	}

	private String body(DemoRequest request) {
		String useCases = request.useCases().stream()
				.map(code -> USE_CASE_LABELS.getOrDefault(code, code))
				.collect(Collectors.joining(", "));
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
