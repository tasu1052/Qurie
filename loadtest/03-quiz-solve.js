import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter } from 'k6/metrics';
import { login, studentEmail, PASSWORD, BASE_URL } from './lib/auth.js';

/**
 * 시나리오 3: 퀴즈 풀이 — 학생 N명이 문항을 받아 순서대로 제출
 * 측정 포인트:
 *   - GET /questions: 문항 수만큼 choices 를 따로 SELECT 하는 N+1 경로 (문항 20개 = 22쿼리)
 *   - POST /progress: 제출 1건당 11쿼리 + 제출마다 반 전체 집계 후 웹소켓 브로드캐스트
 *   30명 × 20문항이면 서버에서 약 6,600 쿼리가 나가는 것이 현재 구현 — p95 로 체감치를 잡는다.
 *
 * 사전 조건: QUIZ_SET_ID 의 퀴즈셋이 COMPLETED 상태이고, 학생 계정들이 해당 세션 반의 구성원이어야 한다.
 * 재실행하면 이미 제출한 문항은 409 로 떨어진다(quiz_submit_duplicate 로 집계, 실패 아님).
 *
 * 실행:
 *   k6 run -e BASE_URL=http://localhost:8080 -e QUIZ_SET_ID=1 -e STUDENTS=30 -e THINK_SECONDS=1 03-quiz-solve.js
 *   THINK_SECONDS=0 이면 전원 동시 폭주(버스트) 모드.
 */
const QUIZ_SET_ID = __ENV.QUIZ_SET_ID;
const STUDENTS = Number(__ENV.STUDENTS || 30);
const THINK_SECONDS = Number(__ENV.THINK_SECONDS || 1);

const duplicates = new Counter('quiz_submit_duplicate');
const serverErrors = new Counter('quiz_submit_5xx');

export const options = {
	scenarios: {
		solve: {
			executor: 'per-vu-iterations',
			vus: STUDENTS,
			iterations: 1,
			maxDuration: '10m',
		},
	},
	thresholds: {
		'http_req_duration{name:GET /questions}': ['p(95)<1000'],
		'http_req_duration{name:POST /progress}': ['p(95)<500'],
		quiz_submit_5xx: ['count==0'],
	},
};

function localDateTime(msAgo) {
	return new Date(Date.now() - msAgo).toISOString().slice(0, 19);
}

export default function () {
	login(studentEmail(__VU), PASSWORD);

	const questionsRes = http.get(`${BASE_URL}/api/quiz/${QUIZ_SET_ID}/questions`, {
		tags: { name: 'GET /questions' },
	});
	check(questionsRes, { 'questions 200': (r) => r.status === 200 });
	if (questionsRes.status !== 200) {
		fail(`문항 조회 실패: ${questionsRes.status} ${questionsRes.body}`);
	}

	const quizzes = questionsRes.json().quizzes;
	for (const quiz of quizzes) {
		const body = JSON.stringify({
			status: 'ATTEMPTED',
			chosenChoiceIdx: quiz.choices[Math.floor(Math.random() * quiz.choices.length)].idx,
			startedAt: localDateTime(3000),
			finishedAt: localDateTime(0),
		});
		const res = http.post(
			`${BASE_URL}/api/quiz/${QUIZ_SET_ID}/questions/${quiz.id}/progress`,
			body,
			{
				headers: { 'Content-Type': 'application/json' },
				tags: { name: 'POST /progress' },
			});

		check(res, { 'submit 201/409': (r) => r.status === 201 || r.status === 409 });
		if (res.status === 409) {
			duplicates.add(1);
		} else if (res.status >= 500) {
			serverErrors.add(1);
		}
		if (THINK_SECONDS > 0) {
			sleep(THINK_SECONDS);
		}
	}
}
