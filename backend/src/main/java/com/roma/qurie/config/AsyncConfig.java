package com.roma.qurie.config;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 초대 메일 발송용 비동기 실행기.
 *
 * 기본 실행기를 쓰지 않고 별도로 만드는 이유는 경계를 정하기 위해서다 — SMTP 왕복은 느리고,
 * 일괄 초대 한 번에 최대 200건이 한꺼번에 쏟아진다. 스레드 수를 묶어 SMTP 서버와 서버 자원을 함께 보호한다.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

	/**
	 * 세션 리포트 일괄 발급 오케스트레이터. 발급 요청은 202 로 즉시 응답하고 실제 발급은 이 스레드가
	 * 학생별 작업을 reportAiExecutor 에 뿌린 뒤 완료를 기다린다 — 요청 스레드(tomcat)가 학생 수 ×
	 * AI 호출 시간만큼 묶여 게이트웨이(CloudFront 30초)에 잘리던 것을 끊는 지점이다.
	 * 세션 단위 진행 중 가드가 앞단에 있어 동시 실행 수가 작다. 큐 0 — 넘치면 즉시 거절해야
	 * 사용자가 "접수됐는데 감감무소식"이 아니라 재시도 안내를 받는다.
	 */
	@Bean
	public Executor reportBulkExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(0);
		executor.setThreadNamePrefix("report-bulk-");
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.initialize();
		return executor;
	}

	/**
	 * 리포트 학생별 발급 워커(집계 + AI 호출 + 저장). 동시 6 인 이유:
	 * - 병목은 LLM 왕복이라 스레드를 더 늘려도 이득이 없다
	 * - HikariCP 기본 풀(10)에서 집계·저장 트랜잭션이 커넥션을 잠깐씩 쓰므로 여유를 남긴다
	 * - GMS 게이트웨이에 한꺼번에 수십 콜을 쏘면 429 로 되돌아온다
	 * 30명 반 기준 5라운드 × LLM 1회 시간이면 끝난다(순차 30회 대비 약 6배).
	 */
	@Bean
	public Executor reportAiExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(6);
		executor.setMaxPoolSize(6);
		// 30명 반 두 세션이 겹쳐도 큐에 담긴다. 워커 큐가 넘칠 규모면 반 편성이 잘못된 것이다.
		executor.setQueueCapacity(200);
		executor.setThreadNamePrefix("report-ai-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.initialize();
		return executor;
	}

	@Bean
	public Executor invitationMailExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(4);
		// 200건 일괄 초대 두 번이 겹쳐도 큐에 담긴다. 넘치면 CallerRuns 로 요청 스레드가 대신 보낸다.
		executor.setQueueCapacity(500);
		executor.setThreadNamePrefix("invite-mail-");
		/*
		 * 큐가 가득 찼을 때 버리지 않고 호출 스레드에서 실행한다.
		 * 초대 메일을 못 받으면 사용자가 가입 자체를 못 하므로, 느려지는 편이 조용히 사라지는 것보다 낫다.
		 */
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		// 재배포로 종료될 때 큐에 남은 메일을 보내고 내려간다.
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(20);
		executor.initialize();
		return executor;
	}
}
