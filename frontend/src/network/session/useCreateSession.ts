import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession } from './session';
import { queryKeys } from '../core/queryKeys';

export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
        },
    });
};