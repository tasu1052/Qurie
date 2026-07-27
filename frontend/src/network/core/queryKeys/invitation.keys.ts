import type { ListParams } from '../types';

export const invitationKeys = {
    all: ['invitations'] as const,
    lists: () => [...invitationKeys.all, 'list'] as const,
    list: (filters: ListParams & { status?: string; role?: string; classId?: number }) => 
        [...invitationKeys.lists(), filters] as const,
    detail: (id: number) => [...invitationKeys.all, 'detail', id] as const,
    token: (token: string) => [...invitationKeys.all, 'token', token] as const,
};