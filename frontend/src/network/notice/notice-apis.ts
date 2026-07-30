import { axiosInstance } from '../core/axiosInstance';
import type { PageResponse } from '../core/types';
import type { NoticeListFilters, NoticeScope } from '../core/queryKeys/notice.keys';

export type { NoticeScope, NoticeListFilters };

export interface NoticeResponse {
    id: number;
    scope: NoticeScope;
    trackId: number | null;
    classId: number | null;
    targetName: string | null;
    title: string;
    body: string;
    pinned: boolean;
    authorName: string;
    createdAt: string;
}

export const getNotices = async (
    params?: NoticeListFilters,
): Promise<PageResponse<NoticeResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<NoticeResponse>>('/notices', { params });
    return data;
};
