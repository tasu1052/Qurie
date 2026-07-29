import type { ListParams } from '../types';

export type ClassListFilters = ListParams & {
    trackId?: number;
};

export const classKeys = {
    all: ['classes'] as const,
    me: () => [...classKeys.all, 'me'] as const,
    list: (filters: ClassListFilters = {}) => [...classKeys.all, 'list', filters] as const,
    detail: (classId: number) => [...classKeys.all, 'detail', classId] as const,
};
