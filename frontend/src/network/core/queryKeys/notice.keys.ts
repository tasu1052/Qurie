import type { ListParams } from '../types';

export type NoticeScope = 'ENTERPRISE' | 'TRACK' | 'CLASS';

export type NoticeListFilters = ListParams & {
    scope?: NoticeScope;
    trackId?: number;
    classId?: number;
};

export const noticeKeys = {
    all: ['notices'] as const,
    list: (filters: NoticeListFilters = {}) => [...noticeKeys.all, 'list', filters] as const,
};
