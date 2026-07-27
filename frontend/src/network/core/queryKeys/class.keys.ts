import type { ListParams } from '../types';

export const classKeys = {
    all: ['classes'] as const,
    lists: () => [...classKeys.all, 'list'] as const,
    list: (filters: ListParams & { trackId?: number; tech?: string; status?: string }) =>
        [...classKeys.lists(), filters] as const,
    detail: (id: number) => [...classKeys.all, 'detail', id] as const,
    members: (classId: number, filters?: ListParams & { role?: string; flag?: string }) =>
        [...classKeys.detail(classId), 'members', filters ?? {}] as const,
    groups: (classId: number, filters?: ListParams & { mine?: boolean }) =>
        [...classKeys.detail(classId), 'groups', filters ?? {}] as const,
};