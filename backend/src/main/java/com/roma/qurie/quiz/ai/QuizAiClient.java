package com.roma.qurie.quiz.ai;

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
 * 퀴즈 생성 AI 서버(FastAPI) HTTP 클라이언트.
 *
 * 생성은 비동기다 — create 는 접수(quiz_set_id)만 받고, 문항은 getStatus 폴링으로 가져온다.
 * 로컬은 uvicorn 기본 포트(8000), 배포는 같은 EC2 라 AI_BASE_URL 로 주소만 바꾼다.
 */
@Component
public class QuizAiClient {

	/** 생성 요청은 접수만 하고 돌아오지만, LLM 큐가 밀려 있으면 접수 자체가 느릴 수 있어 여유를 둔다. */
	private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
	private static final Duration READ_TIMEOUT = Duration.ofSeconds(15);

	private final RestClient restClient;

	public QuizAiClient(@Value("${app.ai.base-url:http://localhost:8000}") String baseUrl) {
		// 타임아웃 없는 기본 팩토리를 쓰면 AI 서버가 멈췄을 때 요청 스레드가 같이 묶인다.
		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build());
		requestFactory.setReadTimeout(READ_TIMEOUT);
		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(requestFactory)
				.build();
	}

	public AiQuizSetAccepted createQuizSet(Long projectId, AiQuizCreateRequest request) {
		try {
			return restClient.post()
					.uri(uriBuilder -> uriBuilder.path("/api/quiz").queryParam("project", projectId).build())
					.contentType(MediaType.APPLICATION_JSON)
					.body(request)
					.retrieve()
					.body(AiQuizSetAccepted.class);
		} catch (RestClientException e) {
			throw new QuizAiException("AI 퀴즈 생성 요청 실패: " + describe(e), e);
		}
	}

	public AiQuizStatusResponse getStatus(Long aiQuizSetId) {
		try {
			return restClient.get()
					.uri("/api/quiz/{id}/status", aiQuizSetId)
					.retrieve()
					.body(AiQuizStatusResponse.class);
		} catch (RestClientException e) {
			throw new QuizAiException("AI 퀴즈 상태 조회 실패: " + describe(e), e);
		}
	}

	/* 4xx/5xx 는 상태 코드가 원인 파악에 제일 중요하므로 메시지에 남긴다. */
	private String describe(RestClientException e) {
		if (e instanceof RestClientResponseException response) {
			return "HTTP " + response.getStatusCode().value();
		}
		return e.getMessage();
	}
}
