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
    // UI 는 1-베이스 페이지를 쓰지만 Spring Pageable 은 0-베이스라 여기서 변환한다.
    // page=1 을 그대로 보내면 백엔드가 두 번째 페이지로 해석해 첫 페이지 공지가 통째로 빠진다.
    const query = params?.page != null ? { ...params, page: params.page - 1 } : params;
    const { data } = await axiosInstance.get<PageResponse<NoticeResponse>>('/notices', {
        params: query,
    });
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
