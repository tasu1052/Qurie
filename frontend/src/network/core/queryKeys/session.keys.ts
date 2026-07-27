import type { ListParams } from '../types';

export const sessionKeys = {
    all: ['sessions'] as const,
    lists: () => [...sessionKeys.all, 'list'] as const,
    list: (filters: ListParams & { classId?: number; status?: string; mine?: boolean }) =>
        [...sessionKeys.lists(), filters] as const,
    detail: (id: number) => [...sessionKeys.all, 'detail', id] as const,
    participants: (id: number) => [...sessionKeys.detail(id), 'participants'] as const,
    project: (id: number) => [...sessionKeys.detail(id), 'project'] as const,
    reports: (id: number) => [...sessionKeys.detail(id), 'reports'] as const,
};