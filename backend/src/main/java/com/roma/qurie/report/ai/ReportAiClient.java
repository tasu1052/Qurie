package com.roma.qurie.report.ai;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * 리포트 정성 항목 생성 AI 서버(FastAPI) HTTP 클라이언트.
 *
 * 퀴즈 생성과 달리 동기 API 다 — LLM 호출 1회가 요청 안에서 끝나므로 응답 대기를 길게 잡는다.
 * 퀴즈 생성과 같은 서버라 주소는 app.ai.base-url 을 공유한다.
 */
@Component
public class ReportAiClient {

	private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
	/** LLM 1회 호출을 요청 안에서 기다린다. 평시 수 초지만 LLM 큐가 밀리면 늘어져 여유를 둔다. */
	private static final Duration READ_TIMEOUT = Duration.ofSeconds(60);
	private static final int MAX_ERROR_BODY_LENGTH = 300;

	private final RestClient restClient;

	public ReportAiClient(@Value("${app.ai.base-url:http://localhost:8000}") String baseUrl) {
		// HTTP/1.1 고정 이유는 QuizAiClient 와 같다 — JDK HttpClient 기본값(HTTP/2)은 평문 연결에
		// h2c 업그레이드 헤더를 실어 보내는데, uvicorn(h11)이 본문을 앱에 넘기지 않아 422 가 난다.
		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder()
						.version(HttpClient.Version.HTTP_1_1)
						.connectTimeout(CONNECT_TIMEOUT)
						.build());
		requestFactory.setReadTimeout(READ_TIMEOUT);
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(requestFactory)
				.build();
	}

	public AiReportResponse createReport(AiReportCreateRequest request) {
		try {
			return restClient.post()
					.uri("/api/report")
					.contentType(MediaType.APPLICATION_JSON)
					.body(request)
					.retrieve()
					.body(AiReportResponse.class);
		} catch (RestClientException e) {
			throw new ReportAiException("AI 리포트 생성 요청 실패: " + describe(e), e);
		}
	}

	/**
	 * 4xx/5xx 는 상태 코드가 원인 파악에 제일 중요하므로 메시지에 남긴다.
	 * pydantic 422 는 본문을 봐야 어느 필드가 어긋났는지 알 수 있어 길이 제한을 걸고 함께 남긴다.
	 */
	private String describe(RestClientException e) {
		if (e instanceof RestClientResponseException response) {
			String status = "HTTP " + response.getStatusCode().value();
			String body = response.getResponseBodyAsString();
			return body.isBlank() ? status : status + " " + truncate(body);
		}
		return e.getMessage();
	}

	private String truncate(String body) {
		String flattened = body.replaceAll("\\s+", " ").trim();
		return flattened.length() <= MAX_ERROR_BODY_LENGTH
				? flattened
				: flattened.substring(0, MAX_ERROR_BODY_LENGTH) + "…";
	}
}
