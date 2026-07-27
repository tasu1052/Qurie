import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signup } from './auth';
import { queryKeys } from '../core/queryKeys';

export const useSignup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: signup,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        },
    });
};