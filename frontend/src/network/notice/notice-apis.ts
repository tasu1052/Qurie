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

export type NoticeAuthorType = 'MASTER' | 'MANAGER';

export interface NoticeCreateRequest {
    scope: NoticeScope;
    trackId?: number;
    classId?: number;
    title: string;
    body: string;
    pinned: boolean;
}

export interface NoticeUpdateRequest {
    title?: string;
    body?: string;
    pinned?: boolean;
}

export interface NoticeDetailResponse {
    id: number;
    scope: NoticeScope;
    trackId: number | null;
    classId: number | null;
    title: string;
    body: string;
    pinned: boolean;
    createdBy: number;
    createdByType: NoticeAuthorType;
    createdAt: string;
    updatedAt: string;
}

export const getNotices = async (
    params?: NoticeListFilters,
): Promise<PageResponse<NoticeResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<NoticeResponse>>('/notices', { params });
    return data;
};

export const getNotice = async (noticeId: number): Promise<NoticeResponse> => {
    const { data } = await axiosInstance.get<NoticeResponse>(`/notices/${noticeId}`);
    return data;
};

export const createNotice = async (body: NoticeCreateRequest): Promise<NoticeDetailResponse> => {
    const { data } = await axiosInstance.post<NoticeDetailResponse>('/notices', body);
    return data;
};

export const updateNotice = async (
    noticeId: number,
    body: NoticeUpdateRequest,
): Promise<NoticeDetailResponse> => {
    const { data } = await axiosInstance.patch<NoticeDetailResponse>(`/notices/${noticeId}`, body);
    return data;
};

export const deleteNotice = async (noticeId: number): Promise<void> => {
    await axiosInstance.delete(`/notices/${noticeId}`);
};
