import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { login, PASSWORD, BASE_URL } from './lib/auth.js';

/**
 * 시나리오 4: 세션 리포트
 *
 * MODE=bulk (기본) — 강사가 전원 일괄 발급(POST /reports/all)을 1회 호출하고 소요 시간을 잰다.
 *   현재 구현은 학생 수 × (집계 쿼리 + AI 동기 호출 최대 60초) 순차 루프라서
 *   학생 수에 정비례해 늘어나는 응답 시간이 그대로 개선 전 baseline 이 된다.
 *
 * MODE=race — 같은 학생의 단건 발급(POST /reports)을 동시 RACE_VUS 발 쏜다.
 *   check 와 save 사이에 AI 호출(수 초)이 끼어 있어 레이스 윈도우가 크다.
 *   기대: 1건 201 + 나머지 409 / 현재 구현 예상: 500 다수 + AI 중복 호출(비용 낭비).
 *
 * 사전 조건: AI 서버가 떠 있어야 한다. INSTRUCTOR_EMAIL 은 해당 반 강사 계정.
 *
 * 실행:
 *   k6 run -e BASE_URL=... -e SESSION_ID=1 -e INSTRUCTOR_EMAIL=teacher@test.com 04-report.js
 *   k6 run -e BASE_URL=... -e SESSION_ID=1 -e INSTRUCTOR_EMAIL=... -e MODE=race -e STUDENT_ID=5 04-report.js
 */
const SESSION_ID = __ENV.SESSION_ID;
const MODE = __ENV.MODE || 'bulk';
const RACE_VUS = Number(__ENV.RACE_VUS || 10);

const bulkDuration = new Trend('report_bulk_duration', true);
const raceServerErrors = new Counter('report_race_5xx');
const raceCreated = new Counter('report_race_created');

export const options = {
	scenarios: MODE === 'race'
		? {
			race: {
				executor: 'per-vu-iterations',
				vus: RACE_VUS,
				iterations: 1,
				maxDuration: '5m',
			},
		}
		: {
			bulk: {
				executor: 'per-vu-iterations',
				vus: 1,
				iterations: 1,
				maxDuration: '35m',
			},
		},
	thresholds: MODE === 'race'
		? { report_race_5xx: ['count==0'], report_race_created: ['count==1'] }
		: { report_bulk_duration: ['p(95)<30000'] },
};

export default function () {
	login(__ENV.INSTRUCTOR_EMAIL, __ENV.INSTRUCTOR_PASSWORD || PASSWORD);

	if (MODE === 'race') {
		const res = http.post(
			`${BASE_URL}/api/sessions/${SESSION_ID}/reports`,
			JSON.stringify({ ordinaryUserId: Number(__ENV.STUDENT_ID) }),
			{
				headers: { 'Content-Type': 'application/json' },
				tags: { name: 'POST /reports (race)' },
				timeout: '180s',
			});
		check(res, { 'race 201 or 409': (r) => r.status === 201 || r.status === 409 });
		if (res.status === 201) {
			raceCreated.add(1);
		} else if (res.status >= 500) {
			raceServerErrors.add(1);
		}
		return;
	}

	const started = Date.now();
	const res = http.post(`${BASE_URL}/api/sessions/${SESSION_ID}/reports/all`, null, {
		tags: { name: 'POST /reports/all' },
		timeout: '1800s',
	});
	bulkDuration.add(Date.now() - started);
	check(res, { 'bulk 201': (r) => r.status === 201 });
	console.log(`일괄 발급 소요: ${((Date.now() - started) / 1000).toFixed(1)}s, status=${res.status}, body=${res.body}`);
}
