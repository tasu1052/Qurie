import type { ListParams, UserRole } from '../types';

export type UserListFilters = ListParams & {
    role?: UserRole;
    q?: string;
};

export const userKeys = {
    all: ['users'] as const,
    list: (filters: UserListFilters = {}) => [...userKeys.all, 'list', filters] as const,
    detail: (userId: number) => [...userKeys.all, 'detail', userId] as const,
    sessionReports: (userId: number) => [...userKeys.detail(userId), 'session-reports'] as const,
};
