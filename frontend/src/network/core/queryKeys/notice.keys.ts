import type { ListParams } from '../types';

export const noticeKeys = {
    all: ['notices'] as const,
    lists: () => [...noticeKeys.all, 'list'] as const,
    list: (filters: ListParams & { scope?: string; trackId?: number; classId?: number }) =>
        [...noticeKeys.lists(), filters] as const,
    detail: (id: number) => [...noticeKeys.all, 'detail', id] as const,
};