import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    confirmPasswordReset,
    getMe,
    login,
    logout,
    refresh,
    requestPasswordReset,
    type LoginRequest,
    type PasswordResetConfirmRequest,
    type PasswordResetRequest,
} from './auth-apis';
import { notifyLogout } from './logoutSignal';

export const useMe = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getMe,
    });
};

/** Non-suspense auth probe for public pages (e.g. landing). */
export const useMeOptional = () => {
    return useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getMe,
        retry: false,
        staleTime: 60_000,
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: LoginRequest) => login(body),
        onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.auth.me(), data);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logout,
        // 요청이 실패해도(네트워크 등) 로컬 정리는 해야 한다 — 쿠키가 남아 있어도 화면은 로그아웃 상태로 간다.
        onSettled: () => {
            // auth 키만 지우면 이전 사용자의 클래스·학생·세션 캐시가 남아 다음 로그인 화면에 그려질 수 있다.
            queryClient.clear();
            // 다른 탭의 세션 소켓·캐시까지 정리하도록 알린다.
            notifyLogout();
        },
    });
};

export const useRefresh = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: refresh,
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.auth.me(), data);
        },
    });
};

export const useRequestPasswordReset = () => {
    return useMutation({
        mutationFn: (body: PasswordResetRequest) => requestPasswordReset(body),
    });
};

export const useConfirmPasswordReset = () => {
    return useMutation({
        mutationFn: (body: PasswordResetConfirmRequest) => confirmPasswordReset(body),
    });
};