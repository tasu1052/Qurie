import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createInvitation,
    getInvitationPreview,
    type InvitationCreateRequest,
} from './invitation-apis';

export const useGetInvitationPreview = (token: string) => {
    return useSuspenseQuery({
        queryKey: queryKeys.invitations.preview(token),
        queryFn: () => getInvitationPreview(token),
    });
};

export const useCreateInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: InvitationCreateRequest) => createInvitation(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
    });
};
