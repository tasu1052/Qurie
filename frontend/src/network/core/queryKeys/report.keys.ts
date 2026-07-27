import type { ListParams } from '../types';

export const reportKeys = {
    all: ['reports'] as const,
    lists: () => [...reportKeys.all, 'list'] as const,
    list: (filters: ListParams & { userId?: number | 'me'; sessionId?: number }) =>
        [...reportKeys.lists(), filters] as const,
    detail: (id: number) => [...reportKeys.all, 'detail', id] as const,
};