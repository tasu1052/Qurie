import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    getUserProfile,
    signUp,
    updateUserProfile,
    type UserProfileUpdateRequest,
    type UserSignUpRequest,
} from './user-apis';

export const useSignUp = () => {
    return useMutation({
        mutationFn: (body: UserSignUpRequest) => signUp(body),
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
        mutationFn: ({ userId, ...body }: UserProfileUpdateRequest & { userId: number }) => updateUserProfile(userId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(data.userId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
        },
    });
};