import type { ListParams } from '../types';

export type NoticeScope = 'ENTERPRISE' | 'TRACK' | 'CLASS';

export type NoticeListFilters = ListParams & {
    scope?: NoticeScope;
    trackId?: number;
    classId?: number;
    /** 매니저·학생: 기업 전체 + 내 트랙 + 내 반 CLASS */
    forAudience?: boolean;
};

export const noticeKeys = {
    all: ['notices'] as const,
    list: (filters: NoticeListFilters = {}) => [...noticeKeys.all, 'list', filters] as const,
};
