import { useSuspenseQuery } from '@tanstack/react-query';
import { getInvitationByToken } from './invitation';
import { queryKeys } from '../core/queryKeys';

export const useGetInvitationByToken = (token: string) => {
    return useSuspenseQuery({
        queryKey: queryKeys.invitations.token(token),
        queryFn: () => getInvitationByToken(token),
    });
};