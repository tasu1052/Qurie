/**
 * 최소 STOMP 1.2 프레임 유틸.
 * 서버가 SockJS 없이 순수 WebSocket(/ws) + SimpleBroker 라서 프레임을 직접 만들어 쏘면 된다.
 */
const NULL = String.fromCharCode(0);

function frame(command, headers, body) {
	const lines = [command];
	for (const key in headers) {
		lines.push(`${key}:${headers[key]}`);
	}
	return lines.join('\n') + '\n\n' + (body || '') + NULL;
}

export function connectFrame() {
	return frame('CONNECT', { 'accept-version': '1.1,1.2', 'heart-beat': '0,0' });
}

export function subscribeFrame(id, destination) {
	return frame('SUBSCRIBE', { id, destination });
}

export function sendFrame(destination, body) {
	const headers = { destination };
	if (body) {
		headers['content-type'] = 'application/json';
	}
	return frame('SEND', headers, body);
}

/** 수신 텍스트를 { command, headers, body } 로 파싱. heart-beat 개행은 null 반환. */
export function parse(message) {
	if (!message || message === '\n') {
		return null;
	}
	const end = message.indexOf(NULL);
	const raw = end >= 0 ? message.slice(0, end) : message;
	const headerEnd = raw.indexOf('\n\n');
	if (headerEnd < 0) {
		return null;
	}
	const headerLines = raw.slice(0, headerEnd).split('\n');
	const command = headerLines.shift();
	const headers = {};
	for (const line of headerLines) {
		const sep = line.indexOf(':');
		headers[line.slice(0, sep)] = line.slice(sep + 1);
	}
	return { command, headers, body: raw.slice(headerEnd + 2) };
}
