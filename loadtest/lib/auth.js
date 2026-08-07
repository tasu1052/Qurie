import http from 'k6/http';
import { fail } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

/**
 * 로그인 후 ACCESS_TOKEN 쿠키 값을 돌려준다.
 * k6 는 VU 별 쿠키 jar 를 자동 관리하므로 이후 http.* 호출에는 쿠키가 자동으로 붙는다.
 * WebSocket 핸드셰이크는 jar 를 안 타기 때문에 반환된 토큰을 Cookie 헤더로 직접 넣어야 한다.
 */
export function login(email, password) {
	const res = http.post(`${BASE}/api/auth/login`, JSON.stringify({ email, password }), {
		headers: { 'Content-Type': 'application/json' },
		tags: { name: 'POST /api/auth/login' },
	});
	if (res.status !== 200) {
		fail(`login failed for ${email}: ${res.status} ${res.body}`);
	}
	return res.cookies['ACCESS_TOKEN'][0].value;
}

/** VU 번호(1-base)로 학생 계정 이메일을 만든다. student1@test.com, student2@test.com ... */
export function studentEmail(vuIndex) {
	const prefix = __ENV.STUDENT_PREFIX || 'student';
	const domain = __ENV.STUDENT_DOMAIN || '@test.com';
	return `${prefix}${vuIndex}${domain}`;
}

export const PASSWORD = __ENV.PASSWORD || 'password123!';
export const BASE_URL = BASE;
export const WS_URL = BASE.replace(/^http/, 'ws') + '/ws';
