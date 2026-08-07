import ws from 'k6/ws';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { login, studentEmail, PASSWORD, WS_URL } from './lib/auth.js';
import { connectFrame, subscribeFrame, sendFrame, parse } from './lib/stomp.js';

/**
 * 시나리오 1: 실시간 채팅 (STOMP over WebSocket)
 * 학생 N명이 세션에 입장해 CHAT_SECONDS 동안 CHAT_INTERVAL_MS 간격으로 채팅을 보낸다.
 * 측정: 내가 보낸 메시지가 브로드캐스트로 돌아올 때까지의 왕복 지연(chat_broadcast_latency).
 *
 * 실행:
 *   k6 run -e BASE_URL=http://localhost:8080 -e SESSION_ID=1 -e STUDENTS=30 01-chat.js
 */
const SESSION_ID = __ENV.SESSION_ID;
const STUDENTS = Number(__ENV.STUDENTS || 30);
const CHAT_SECONDS = Number(__ENV.CHAT_SECONDS || 60);
const CHAT_INTERVAL_MS = Number(__ENV.CHAT_INTERVAL_MS || 2000);

const broadcastLatency = new Trend('chat_broadcast_latency', true);
const wsErrors = new Counter('chat_ws_errors');
const stompErrors = new Counter('chat_stomp_errors');

export const options = {
	scenarios: {
		chat: {
			executor: 'per-vu-iterations',
			vus: STUDENTS,
			iterations: 1,
			maxDuration: `${CHAT_SECONDS + 60}s`,
		},
	},
	thresholds: {
		chat_broadcast_latency: ['p(95)<500'],
		chat_ws_errors: ['count==0'],
	},
};

export default function () {
	const token = login(studentEmail(__VU), PASSWORD);
	const marker = `k6-${__VU}-`;

	const res = ws.connect(WS_URL, { headers: { Cookie: `ACCESS_TOKEN=${token}` } }, (socket) => {
		socket.on('open', () => socket.send(connectFrame()));

		socket.on('message', (message) => {
			const stompFrame = parse(message);
			if (!stompFrame) {
				return;
			}
			if (stompFrame.command === 'CONNECTED') {
				socket.send(subscribeFrame('sub-msg', `/topic/sessions/${SESSION_ID}/messages`));
				socket.send(subscribeFrame('sub-err', '/user/queue/errors'));
				socket.send(sendFrame(`/app/sessions/${SESSION_ID}/enter`));

				socket.setInterval(() => {
					const body = JSON.stringify({ content: `${marker}${Date.now()}` });
					socket.send(sendFrame(`/app/sessions/${SESSION_ID}/messages`, body));
				}, CHAT_INTERVAL_MS);

				socket.setTimeout(() => {
					socket.send(sendFrame(`/app/sessions/${SESSION_ID}/leave`));
					socket.close();
				}, CHAT_SECONDS * 1000);
				return;
			}
			if (stompFrame.command === 'MESSAGE') {
				if (stompFrame.headers.destination === '/user/queue/errors') {
					stompErrors.add(1);
					return;
				}
				const payload = JSON.parse(stompFrame.body);
				const content = payload.content || '';
				if (content.startsWith(marker)) {
					broadcastLatency.add(Date.now() - Number(content.slice(marker.length)));
				}
				return;
			}
			if (stompFrame.command === 'ERROR') {
				stompErrors.add(1);
			}
		});

		socket.on('error', () => wsErrors.add(1));
	});

	check(res, { 'ws handshake 101': (r) => r && r.status === 101 });
}
