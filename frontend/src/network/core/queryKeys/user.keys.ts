import type { ListParams, UserRole } from '../types';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: ListParams & { role?: UserRole }) => [...userKeys.lists(), filters] as const,
    detail: (id: number) => [...userKeys.all, 'detail', id] as const,
    reportSummary: (id: number) => [...userKeys.detail(id), 'report-summary'] as const,
    analytics: (id: number) => [...userKeys.detail(id), 'analytics'] as const,
};