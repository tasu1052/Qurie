package com.roma.qurie.invitation;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

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

	/**
	 * 별도 스레드에서 발송한다. SMTP 왕복이 요청 스레드를 잡으면 일괄 초대(최대 200건)가 그만큼 느려진다.
	 * 예외를 삼키므로(@Async 는 예외를 호출자에게 전달하지 못한다) 실패는 여기서 로그로만 남긴다.
	 */
	@Async("invitationMailExecutor")
	public void send(InvitationMail mail) {
		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			log.warn("SMTP 설정이 없어 초대 메일을 보내지 않았습니다. 응답의 signUpUrl 을 직접 전달하세요. email={}",
					mail.email());
			return;
		}

		try {
			MimeMessage mimeMessage = mailSender.createMimeMessage();
			// true: 본문을 plain text/HTML alternative 로 함께 담는다 — HTML 을 못 그리는 클라이언트의 대비책.
			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
			helper.setFrom(from);
			helper.setTo(mail.email());
			helper.setSubject(subject(mail));
			helper.setText(plainTextBody(mail), htmlBody(mail));
			mailSender.send(mimeMessage);
		} catch (MessagingException | MailException e) {
			/*
			 * 메일 실패로 초대까지 되돌리면 다시 발급하는 것 외에 방법이 없다.
			 * 링크는 이미 응답에 담겨 나가므로 초대는 살려두고 실패만 남긴다.
			 */
			log.error("초대 메일 발송에 실패했습니다. email={}", mail.email(), e);
		}
	}

	private String subject(InvitationMail mail) {
		return "[Qurie] " + mail.className() + " 참여 초대";
	}

	private String plainTextBody(InvitationMail mail) {
		return """
				%s 에 %s(으)로 초대되었습니다.

				아래 링크에서 회원가입을 완료해 주세요.
				%s

				이 링크는 %s 까지 유효합니다.
				본인이 요청한 초대가 아니라면 이 메일을 무시하세요.
				""".formatted(
				mail.className(),
				roleLabel(mail),
				mail.signUpUrl(),
				mail.expiresAt().format(EXPIRES_AT_FORMAT));
	}

	/** 클래스 이름은 매니저가 정하는 값이라 HTML 삽입 전에 이스케이프한다. */
	private String htmlBody(InvitationMail mail) {
		String className = HtmlUtils.htmlEscape(mail.className());
		return """
				<!doctype html>
				<html>
				<body style="margin:0;padding:0;background-color:#f4f5f7;
						font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
					<table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
							style="background-color:#f4f5f7;padding:32px 0;">
						<tr>
							<td align="center">
								<table role="presentation" width="480" cellpadding="0" cellspacing="0"
										style="background-color:#ffffff;border-radius:12px;overflow:hidden;
										box-shadow:0 1px 4px rgba(0,0,0,0.08);">
									<tr>
										<td style="background-color:#4f46e5;padding:24px 32px;">
											<span style="color:#ffffff;font-size:20px;font-weight:700;">Qurie</span>
										</td>
									</tr>
									<tr>
										<td style="padding:32px;">
											<p style="margin:0 0 8px;color:#111827;font-size:16px;">
												<strong>%s</strong>에 <strong>%s</strong>(으)로 초대되었습니다.
											</p>
											<p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
												아래 버튼을 눌러 회원가입을 완료해 주세요.
											</p>
											<table role="presentation" cellpadding="0" cellspacing="0">
												<tr>
													<td style="border-radius:8px;background-color:#4f46e5;">
														<a href="%s" style="display:inline-block;padding:12px 24px;
																color:#ffffff;font-size:14px;font-weight:600;
																text-decoration:none;">
															회원가입 완료하기
														</a>
													</td>
												</tr>
											</table>
											<p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
												이 링크는 %s 까지 유효합니다.<br>
												버튼이 동작하지 않으면 다음 주소를 브라우저에 붙여넣으세요:<br>
												<a href="%s" style="color:#4f46e5;word-break:break-all;">%s</a>
											</p>
										</td>
									</tr>
									<tr>
										<td style="padding:16px 32px;background-color:#f9fafb;">
											<p style="margin:0;color:#9ca3af;font-size:12px;">
												본인이 요청한 초대가 아니라면 이 메일을 무시하세요.
											</p>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</body>
				</html>
				""".formatted(
				className,
				roleLabel(mail),
				mail.signUpUrl(),
				mail.expiresAt().format(EXPIRES_AT_FORMAT),
				mail.signUpUrl(),
				mail.signUpUrl());
	}

	private String roleLabel(InvitationMail mail) {
		return switch (mail.role()) {
			case MANAGER -> "매니저";
			case STUDENT -> "학생";
		};
	}
}
