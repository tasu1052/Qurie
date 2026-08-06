package com.roma.qurie.marketing;

import com.roma.qurie.marketing.dto.DemoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/marketing")
@RequiredArgsConstructor
public class DemoRequestController {

	private final DemoRequestMailSender mailSender;

	@PostMapping("/demo-requests")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void submit(@Valid @RequestBody DemoRequest request) {
		try {
			mailSender.send(request);
		} catch (MailException e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "문의 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", e);
		}
	}
}
