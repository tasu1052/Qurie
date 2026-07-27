import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvitation } from './invitation';
import { queryKeys } from '../core/queryKeys';

export const useCreateInvitation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createInvitation,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
        },
    });
};