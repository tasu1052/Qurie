import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

export interface SessionCreateRequest {
    classId: number;
    title: string;
    /** @deprecated 서버는 JWT에서 생성자를 결정한다. 전송하지 않는다. */
    createdBy?: number;
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

export interface SessionParticipantResponse {
    userId: number;
    name: string;
    role: UserRole;
}

export const createSession = async (body: SessionCreateRequest): Promise<SessionResponse> => {
    const { data } = await axiosInstance.post<SessionResponse>('/sessions', {
        classId: body.classId,
        title: body.title,
    });
    return data;
};

export const getSession = async (sessionId: number): Promise<SessionResponse> => {
    const { data } = await axiosInstance.get<SessionResponse>(`/sessions/${sessionId}`);
    return data;
};

export const getSessions = async (classId: number): Promise<SessionResponse[]> => {
    const { data } = await axiosInstance.get<SessionResponse[]>('/sessions', {
        params: { classId },
    });
    return data;
};

export const getSessionParticipants = async (
    sessionId: number,
): Promise<SessionParticipantResponse[]> => {
    const { data } = await axiosInstance.get<SessionParticipantResponse[]>(
        `/sessions/${sessionId}/participants`,
    );
    return data;
};

export const updateSession = async (
    sessionId: number,
    body: SessionUpdateRequest,
): Promise<SessionResponse> => {
    const { data } = await axiosInstance.patch<SessionResponse>(`/sessions/${sessionId}`, body);
    return data;
};

export const deleteSession = async (sessionId: number): Promise<void> => {
    await axiosInstance.delete(`/sessions/${sessionId}`);
};
