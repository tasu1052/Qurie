package com.roma.qurie.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SessionReportManagerCommentRequest(
		@NotBlank @Size(max = 2048) String comment) {
}
