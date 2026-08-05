import { isAxiosError } from 'axios';

/**
 * HTTP 오류를 비개발자도 읽을 수 있는 한국어 문장으로 바꾼다.
 *
 * 우선순위:
 * 1. 백엔드가 내려준 한국어 사유 (server.error.include-message=always 라 body.message 에 실린다)
 * 2. 상태코드별 일반 설명 (409 → "이미 처리된 요청과 겹쳤어요" 등)
 * 3. 호출부가 준 fallback
 *
 * "Request failed with status code 409" 같은 axios 기본 메시지를 그대로 노출하지 않기 위한 유틸이다.
 */
export function humanizeApiError(error: unknown, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'): string {
    if (isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
            return '서버 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.';
        }
        if (!error.response) {
            return '서버에 연결하지 못했어요. 네트워크 상태를 확인해 주세요.';
        }

        const data = error.response.data as { message?: unknown } | undefined;
        const serverMessage = typeof data?.message === 'string' ? data.message.trim() : '';
        // 백엔드는 한국어 사유를 내려준다. 영어 기본 문구(No message available 등)는 걸러낸다.
        if (serverMessage && /[가-힣]/.test(serverMessage)) {
            return serverMessage;
        }

        switch (error.response.status) {
            case 400:
                return '요청 내용이 올바르지 않아요. 입력값을 확인해 주세요.';
            case 401:
                return '로그인이 필요하거나 로그인이 만료되었어요. 다시 로그인해 주세요.';
            case 403:
                return '이 작업을 할 수 있는 권한이 없어요.';
            case 404:
                return '요청한 대상을 찾을 수 없어요. 이미 삭제되었을 수 있어요.';
            case 409:
                return '이미 같은 작업이 처리되어 있어 요청이 겹쳤어요. 화면을 새로고침한 뒤 다시 시도해 주세요.';
            case 413:
                return '용량이 허용 범위를 넘었어요. 크기를 줄여 다시 시도해 주세요.';
            case 422:
                return '보낸 내용을 처리할 수 없어요. 입력값을 확인해 주세요.';
            case 429:
                return '요청이 너무 잦아요. 잠시 기다렸다가 다시 시도해 주세요.';
            default:
                if (error.response.status >= 500) {
                    return '서버에 일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
                }
                return fallback;
        }
    }
    return fallback;
}
