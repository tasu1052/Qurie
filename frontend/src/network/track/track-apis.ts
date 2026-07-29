import { axiosInstance } from '../core/axiosInstance';
import type { PageResponse } from '../core/types';
import type { TrackListFilters } from '../core/queryKeys/track.keys';

export interface TrackCreateRequest {
    name: string;
    description?: string;
    tech?: string;
}

export interface TrackUpdateRequest {
    name: string;
    description?: string;
    tech?: string;
}

export interface TrackResponse {
    id: number;
    enterpriseId: number;
    name: string;
    description: string | null;
    tech: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TrackSummaryResponse {
    id: number;
    name: string;
    description: string | null;
    tech: string | null;
    classCount: number;
}

export const createTrack = async (body: TrackCreateRequest): Promise<TrackResponse> => {
    const { data } = await axiosInstance.post<TrackResponse>('/tracks', body);
    return data;
};

export const getTracks = async (
    params?: TrackListFilters,
): Promise<PageResponse<TrackSummaryResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<TrackSummaryResponse>>('/tracks', {
        params,
    });
    return data;
};

export const getTrack = async (trackId: number): Promise<TrackResponse> => {
    const { data } = await axiosInstance.get<TrackResponse>(`/tracks/${trackId}`);
    return data;
};

export const updateTrack = async (
    trackId: number,
    body: TrackUpdateRequest,
): Promise<TrackResponse> => {
    const { data } = await axiosInstance.put<TrackResponse>(`/tracks/${trackId}`, body);
    return data;
};

export const deleteTrack = async (trackId: number): Promise<void> => {
    await axiosInstance.delete(`/tracks/${trackId}`);
};
