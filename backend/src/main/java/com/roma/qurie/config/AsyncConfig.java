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
