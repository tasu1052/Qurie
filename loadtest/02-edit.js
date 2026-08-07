import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter } from 'k6/metrics';
import { login, studentEmail, PASSWORD, BASE_URL } from './lib/auth.js';

/**
 * 시나리오 2: 동시 편집 스냅샷 저장 (PUT /api/projects/{id}/files/content)
 * 편집기 저장은 저장 1회마다 서버가 프로젝트 "전체 파일 본문"을 읽어 versionHash 를 재계산하므로
 * (ProjectService.updateFileContent) 파일 수가 많을수록 응답이 급격히 느려지는 경로다.
 *
 * 모드:
 *   기본        — VU 마다 서로 다른 파일을 저장 (실사용 시나리오, versionHash 정합성 검증용)
 *   SAME_FILE=1 — 전원이 같은 파일을 저장 (lost update 재현)
 *
 * 실행:
 *   k6 run -e BASE_URL=http://localhost:8080 -e PROJECT_ID=1 -e EDITORS=20 -e DURATION=60s 02-edit.js
 *
 * 종료 후 검증(README 참조): DB 의 projects.version_hash 가 실제 파일 내용 해시와 일치하는지.
 */
const PROJECT_ID = __ENV.PROJECT_ID;
const EDITORS = Number(__ENV.EDITORS || 20);
const SAME_FILE = __ENV.SAME_FILE === '1';

const saveConflicts = new Counter('edit_non2xx');

export const options = {
	scenarios: {
		edit: {
			executor: 'constant-vus',
			vus: EDITORS,
			duration: __ENV.DURATION || '60s',
		},
	},
	thresholds: {
		'http_req_duration{name:PUT /files/content}': ['p(95)<1000'],
	},
};

export function setup() {
	login(studentEmail(1), PASSWORD);
	const res = http.get(`${BASE_URL}/api/projects/${PROJECT_ID}/files`);
	if (res.status !== 200) {
		fail(`파일 목록 조회 실패: ${res.status} ${res.body}`);
	}
	const paths = res.json().map((f) => f.path);
	if (paths.length === 0) {
		fail('프로젝트에 파일이 없습니다. 먼저 프로젝트를 임포트하세요.');
	}
	return { paths };
}

export default function (data) {
	if (__ITER === 0) {
		login(studentEmail(__VU), PASSWORD);
	}
	const path = SAME_FILE ? data.paths[0] : data.paths[(__VU - 1) % data.paths.length];
	const content = `// k6 edit vu=${__VU} iter=${__ITER} ts=${Date.now()}\n` + 'x'.repeat(500);

	const res = http.put(
		`${BASE_URL}/api/projects/${PROJECT_ID}/files/content`,
		JSON.stringify({ path, content }),
		{
			headers: { 'Content-Type': 'application/json' },
			tags: { name: 'PUT /files/content' },
		});

	check(res, { 'save 200': (r) => r.status === 200 });
	if (res.status !== 200) {
		saveConflicts.add(1);
	}
	sleep(1);
}
