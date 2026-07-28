import { axiosInstance } from '../core/axiosInstance';

export interface SessionCreateRequest {
    classId: number;
    title: string;
    createdBy: number;
}

export interface SessionUpdateRequest {
    title?: string;
    active?: boolean;
}

export interface SessionResponse {
    id: number;
    classId: number;
    title: string;
    createdBy: number;
    active: boolean;
    createdAt: string;
    endedAt: string | null;
    updatedAt: string;
}

export const createSession = async (body: SessionCreateRequest): Promise<SessionResponse> => {
    const { data } = await axiosInstance.post<SessionResponse>('/sessions', body);
    return data;
};

export const getSession = async (id: number): Promise<SessionResponse> => {
    const { data } = await axiosInstance.get<SessionResponse>(`/sessions/${id}`);
    return data;
};

export const getSessions = async (classId: number): Promise<SessionResponse[]> => {
    const { data } = await axiosInstance.get<SessionResponse[]>('/sessions', {
        params: { classId },
    });
    return data;
};

export const updateSession = async (id: number,body: SessionUpdateRequest): Promise<SessionResponse> => {
    const { data } = await axiosInstance.patch<SessionResponse>(`/sessions/${id}`, body);
    return data;
};

export const deleteSession = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/sessions/${id}`);
};