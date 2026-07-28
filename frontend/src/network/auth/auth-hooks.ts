import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    getMe,
    login,
    logout,
    type LoginRequest,
} from './auth-apis';

export const useMe = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getMe,
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
        onSuccess: () => {
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
        },
    });
};