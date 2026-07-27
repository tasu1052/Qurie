import { axiosInstance } from '../core/axiosInstance';

export interface CreateTrackRequest {
    name: string;
}

export interface Track {
    id: number;
    name: string;
}

export const createTrack = async (body: CreateTrackRequest): Promise<Track> => {
    const { data } = await axiosInstance.post<Track>('/track', body);
    return data;
};