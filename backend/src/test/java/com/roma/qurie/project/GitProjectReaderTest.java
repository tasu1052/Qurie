package com.roma.qurie.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

/**
 * SSRF 방어(URL 검증)만 다룬다. 실제 clone 은 외부 네트워크 의존이라 단위 테스트로 두지 않는다.
 */
class GitProjectReaderTest {

	@Test
	void rejectsNonHttpsScheme() {
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("http://github.com/foo/bar.git"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsUserInfoInUrl() {
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("https://user:token@github.com/foo/bar.git"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsLoopbackAndPrivateAddresses() {
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("https://127.0.0.1/repo.git"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("https://192.168.0.10/repo.git"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("https://localhost/repo.git"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void rejectsMalformedUrl() {
		assertThatThrownBy(() -> GitProjectReader.validateRepoUrl("not a url"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(GitProjectReaderTest::statusOf)
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	/** 공인 호스트 허용 확인. DNS 조회가 필요해서 오프라인 환경에서는 실패할 수 있다. */
	@Test
	void acceptsPublicHttpsRepository() {
		assertThat(GitProjectReader.validateRepoUrl("https://github.com/foo/bar.git").getHost())
				.isEqualTo("github.com");
	}

	private static HttpStatusCode statusOf(Throwable throwable) {
		return ((ResponseStatusException)throwable).getStatusCode();
	}
}
