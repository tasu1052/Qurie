import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession } from '../api/session';
import { queryKeys } from '../queryKeys';

export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSession,
        onSuccess: (_, { class: className }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.session.byClass(className) });
        },
    });
};