import { useSuspenseQuery } from '@tanstack/react-query';
import { getInvitations } from './invitation';
import { queryKeys } from '../core/queryKeys';
import type { ListParams, UserRole } from '../core/types';

export const useGetInvitations = (
  filters: ListParams & { status?: string; role?: UserRole; classId?: number },
) => {
    return useSuspenseQuery({
        queryKey: queryKeys.invitations.list(filters),
        queryFn: () => getInvitations(filters),
    });
};