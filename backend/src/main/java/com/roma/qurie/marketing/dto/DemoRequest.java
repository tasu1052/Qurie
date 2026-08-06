package com.roma.qurie.marketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/** 도입 문의(/demo) 제출 본문. */
public record DemoRequest(
		@NotBlank @Size(max = 50) String lastName,
		@NotBlank @Size(max = 50) String firstName,
		@NotBlank @Email @Size(max = 255) String workEmail,
		@NotBlank @Size(max = 100) String company,
		@NotBlank @Size(max = 100) String title,
		@NotBlank @Size(max = 30) String phone,
		@NotEmpty List<@NotBlank @Size(max = 40) String> useCases,
		@Size(max = 2000) String otherDetail) {
}
