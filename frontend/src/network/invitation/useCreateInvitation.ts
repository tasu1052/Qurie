import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvitation } from '../invitation/invitation';
import { queryKeys } from '../core/queryKeys';

export const useCreateInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInvitation,
        onSuccess: (_, { role }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.invitation.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.invitation.byRole(role) });
        },
    });
};