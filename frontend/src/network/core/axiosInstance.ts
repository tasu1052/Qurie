import axios from 'axios';
import { notifyLogout } from '../auth/logoutSignal';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

/**
 * 진행 중인 토큰 재발급. 서버가 리프레시 토큰을 회전(검증 즉시 기존 토큰 폐기)시키므로
 * 동시에 여러 번 호출하면 첫 요청만 성공하고 나머지는 폐기된 토큰을 보내 401 이 된다.
 * 401 이 여러 개 떠도 재발급은 한 번만 하고, 나머지 요청은 그 결과를 함께 기다린다.
 */
let refreshInFlight: Promise<void> | null = null;

function refreshOnce(): Promise<void> {
    if (!refreshInFlight) {
        refreshInFlight = axiosInstance
            .post('/auth/refresh')
            .then(() => undefined)
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        const url = originalRequest.url ?? '';
        if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            await refreshOnce();
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            // 재발급까지 실패하면 세션이 끝난 것이다. 로그아웃과 같은 정리를 하지 않으면
            // 캐시가 남은 화면(폴링이 없는 세션 방 등)이 계속 로그인 상태로 보인다.
            notifyLogout();
            return Promise.reject(refreshError);
        }
    },
);
