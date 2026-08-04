import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { refresh } from '../auth/auth-apis';
import { queryKeys } from '../core/queryKeys';
import {
    getUserProfile,
    getUsers,
    signUp,
    updateUserProfile,
    type UserListParams,
    type UserProfileUpdateRequest,
    type UserSignUpRequest,
} from './user-apis';

export const useSignUp = () => {
    return useMutation({
        mutationFn: (body: UserSignUpRequest) => signUp(body),
    });
};

export const useGetUsers = (filters: UserListParams = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.users.list(filters),
        queryFn: () => getUsers(filters),
    });
};

export const useGetUserProfile = (userId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => getUserProfile(userId),
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, ...body }: UserProfileUpdateRequest & { userId: number }) =>
            updateUserProfile(userId, body),
        onSuccess: async (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(data.userId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

            const me = await refresh();
            queryClient.setQueryData(queryKeys.auth.me(), me);
        },
    });
};