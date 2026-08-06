package com.roma.qurie.quiz.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.entity.QuizGenerationMode;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpServer;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * QuizAiClient 가 실제로 와이어에 무엇을 쓰는지 검증한다.
 *
 * 직렬화 단위 테스트(AiQuizJsonMappingTest)는 통과하는데 AI 서버가 "본문이 없다"(422 loc:["body"])고
 * 답하는 일이 있었다 — 본문을 만드는 것과 서버가 그걸 읽을 수 있게 보내는 것은 별개 문제라 여기서 잡는다.
 */
class QuizAiClientWireTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	private HttpServer server;
	private BlockingQueue<String> receivedBody;
	private BlockingQueue<Headers> receivedHeaders;
	private String baseUrl;

	@BeforeEach
	void startServer() throws IOException {
		receivedBody = new ArrayBlockingQueue<>(1);
		receivedHeaders = new ArrayBlockingQueue<>(1);
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/api/quiz", exchange -> {
			receivedBody.offer(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			receivedHeaders.offer(exchange.getRequestHeaders());
			byte[] response = "{\"project\":\"1\",\"quiz_set_id\":7,\"status\":\"PENDING\"}"
					.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, response.length);
			exchange.getResponseBody().write(response);
			exchange.close();
		});
		server.start();
		baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
	}

	@AfterEach
	void stopServer() {
		server.stop(0);
	}

	@Test
	void createQuizSetSendsJsonBody() throws InterruptedException {
		AiQuizSetAccepted accepted = new QuizAiClient(baseUrl).createQuizSet(
				1L,
				AiQuizCreateRequest.from(sampleRequest(), List.of(), "http://backend:8080/api/quiz/3/callback"));

		assertThat(accepted.quizSetId()).isEqualTo(7L);

		JsonNode json = objectMapper.readTree(takeBody());
		assertThat(json.get("mode").asText()).isEqualTo("PRACTICE");
		assertThat(json.get("requested_count").asInt()).isEqualTo(5);
		assertThat(json.get("target_files")).isEmpty();
		assertThat(json.get("files").get("src/Main.java")).isNotNull();
	}

	/**
	 * h2c 업그레이드를 시도하면 uvicorn(h11)이 프로토콜 전환 결정 전까지 본문을 앱에 넘기지 않아
	 * FastAPI 가 422 (loc:["body"]) 로 거절한다. 클라이언트가 HTTP/1.1 로 고정돼 있는지 확인한다.
	 */
	@Test
	void createQuizSetDoesNotAttemptProtocolUpgrade() throws InterruptedException {
		new QuizAiClient(baseUrl).createQuizSet(
				1L,
				AiQuizCreateRequest.from(sampleRequest(), List.of(), "http://backend:8080/api/quiz/3/callback"));

		Headers headers = receivedHeaders.poll(5, TimeUnit.SECONDS);
		assertThat(headers).isNotNull();
		assertThat(headers.getFirst("Upgrade")).isNull();
		assertThat(headers.get("Connection")).isNullOrEmpty();
		assertThat(headers.getFirst("Http2-settings")).isNull();
		assertThat(headers.getFirst("Content-type")).isEqualTo("application/json");
	}

	private QuizGenerateRequest sampleRequest() {
		return new QuizGenerateRequest(
				QuizGenerationMode.PRACTICE,
				5,
				1, 1, 1,
				null,
				"hash-3",
				null,
				Map.of("src/Main.java", "public class Main {}"),
				null,
				null);
	}

	private String takeBody() throws InterruptedException {
		String body = receivedBody.poll(5, TimeUnit.SECONDS);
		assertThat(body).as("요청 본문이 전송되어야 한다").isNotNull().isNotBlank();
		return body;
	}
}
