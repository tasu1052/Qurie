package com.roma.qurie.marketing;

import com.roma.qurie.marketing.dto.DemoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/marketing")
@RequiredArgsConstructor
public class DemoRequestController {

	private final DemoRequestMailSender mailSender;

	@PostMapping("/demo-requests")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void submit(@Valid @RequestBody DemoRequest request) {
		// 발송 실패는 MailSender 가 ResponseStatusException(BAD_GATEWAY) 으로 올린다.
		mailSender.send(request);
	}
}
