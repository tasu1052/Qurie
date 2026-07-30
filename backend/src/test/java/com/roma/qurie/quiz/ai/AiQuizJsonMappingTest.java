package com.roma.qurie.quiz.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.roma.qurie.quiz.dto.QuizGenerateRequest;
import com.roma.qurie.quiz.entity.QuizGenerationMode;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * AI 서버(pydantic)와의 JSON 계약 검증. 필드명이 snake_case 라 @JsonProperty 가 빠지면
 * camelCase 로 나가 AI 쪽 접수(422)에서 조용히 깨진다 — 그걸 컴파일 타임에 못 잡으니 여기서 잡는다.
 */
class AiQuizJsonMappingTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void createRequestSerializesToSnakeCaseContract() {
		QuizGenerateRequest request = new QuizGenerateRequest(
				QuizGenerationMode.PRACTICE,
				3,
				30, 50, 20,
				"동시성 위주로",
				"hash-1",
				List.of("src/Main.java"),
				Map.of("src/Main.java", "public class Main {}"));

		AiQuizCreateRequest aiRequest =
				AiQuizCreateRequest.from(request, "http://backend.internal/api/quiz/10/callback");
		JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(aiRequest));

		assertThat(json.get("mode").asText()).isEqualTo("PRACTICE");
		assertThat(json.get("requested_count").asInt()).isEqualTo(3);
		assertThat(json.get("ratio").get("easy").asInt()).isEqualTo(30);
		assertThat(json.get("user_prompt").asText()).isEqualTo("동시성 위주로");
		assertThat(json.get("version_hash").asText()).isEqualTo("hash-1");
		assertThat(json.get("target_files").get(0).asText()).isEqualTo("src/Main.java");
		assertThat(json.get("files").get("src/Main.java").asText()).isEqualTo("public class Main {}");
		assertThat(json.get("callback_url").asText()).isEqualTo("http://backend.internal/api/quiz/10/callback");
	}

	@Test
	void statusResponseDeserializesFromAiPayload() {
		String payload = """
				{
					"project": "1",
					"quiz_set_id": 77,
					"status": "READY",
					"quizzes": [{
						"purpose": "MICRO",
						"difficulty": "HARD",
						"tested_concept": "인덱스 동작",
						"question": "다음 중 옳은 것은?",
						"choices": ["A", "B", "C", "D"],
						"answer_index": 1,
						"explanation": "설명",
						"file_path": "src/Main.java",
						"line_start": 3,
						"line_end": 9
					}],
					"rejected": [{"question": "떨어진 문항", "difficulty": "EASY",
						"tested_concept": "x", "choices": [], "answer_index": 0, "reject_reason": "모호"}],
					"meter": [{"stage": "GENERATE", "model": "gpt", "input_tokens": 10}],
					"error_message": null
				}
				""";

		AiQuizStatusResponse response = objectMapper.readValue(payload, AiQuizStatusResponse.class);

		assertThat(response.quizSetId()).isEqualTo(77L);
		assertThat(response.status()).isEqualTo(AiQuizStatusResponse.AiQuizSetState.READY);
		AiQuizStatusResponse.AiQuiz quiz = response.quizzes().get(0);
		assertThat(quiz.testedConcept()).isEqualTo("인덱스 동작");
		assertThat(quiz.answerIndex()).isEqualTo(1);
		assertThat(quiz.lineStart()).isEqualTo(3);
		assertThat(response.errorMessage()).isNull();
	}
}
