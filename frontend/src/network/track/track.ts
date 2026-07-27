import { axiosInstance } from '../core/axiosInstance';
import type { ListParams, PageResponse } from '../core/types';

export interface TrackCreateRequest {
    name: string;
    description?: string;
    tech: string;
}

export interface TrackUpdateRequest {
    name?: string;
    description?: string;
    tech?: string;
}

export interface TrackResponse {
    id: number;
    name: string;
    description?: string;
    tech: string;
    classCount: number;
    createdAt: string;
    updatedAt: string;
}

export const getTracks = async (
  params: ListParams & { tech?: string },
): Promise<PageResponse<TrackResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<TrackResponse>>('/tracks', { params });
    return data;
};

export const getTrack = async (id: number): Promise<TrackResponse> => {
    const { data } = await axiosInstance.get<TrackResponse>(`/tracks/${id}`);
    return data;
};

export const createTrack = async (body: TrackCreateRequest): Promise<TrackResponse> => {
    const { data } = await axiosInstance.post<TrackResponse>('/tracks', body);
    return data;
};

export const updateTrack = async (id: number, body: TrackUpdateRequest): Promise<TrackResponse> => {
    const { data } = await axiosInstance.put<TrackResponse>(`/tracks/${id}`, body);
    return data;
};

export const deleteTrack = async (id: number, cascade?: boolean): Promise<void> => {
    await axiosInstance.delete(`/tracks/${id}`, { params: { cascade } });
};

export const getTrackClasses = async (trackId: number, params?: ListParams) => {
    const { data } = await axiosInstance.get(`/tracks/${trackId}/classes`, { params });
    return data;
};

export const getTrackManagers = async (trackId: number) => {
    const { data } = await axiosInstance.get(`/tracks/${trackId}/managers`);
    return data;
};