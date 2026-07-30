import { axiosInstance } from '../core/axiosInstance';
import type { ChatMessageListParams } from '../core/queryKeys/session.keys';
import type { UserRole } from '../core/types';

export type { ChatMessageListParams };

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
    /** 클래스 전체 공개 세션(강사용 공개 세션) 여부. */
    classPublic?: boolean;
    /** snake_case 응답 호환용 필드. */
    class_public?: boolean;
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

export interface ChatMessageResponse {
    id: number;
    sessionId: number;
    senderId: number;
    senderName: string;
    content: string;
    createdAt: string;
}

export interface SessionReportCreateRequest {
    quizSetId?: number;
    ordinaryUserId?: number;
    quizTotalCount: number;
    quizAttemptedCount: number;
    quizCorrectCount: number;
    quizSkippedCount: number;
    completionRate: number;
    accuracy: number;
    avgElapsedMs?: number;
    difficultyRatio?: Record<string, unknown>;
    conceptStats?: Record<string, unknown>;
    quizRating?: number;
    aiComment?: string;
    aiStrengths?: string[];
    aiImprovements?: string[];
}

export interface SessionReportCreateResponse {
    sessionReportId: number;
    sessionId: number;
    ordinaryUserId: number;
    issuedAt: string;
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

export const getSessionMessages = async (
    sessionId: number,
    params?: ChatMessageListParams,
): Promise<ChatMessageResponse[]> => {
    const { data } = await axiosInstance.get<ChatMessageResponse[]>(
        `/sessions/${sessionId}/messages`,
        { params },
    );
    return data;
};

export const createSessionReport = async (
    sessionId: number,
    body: SessionReportCreateRequest,
): Promise<SessionReportCreateResponse> => {
    const { data } = await axiosInstance.post<SessionReportCreateResponse>(
        `/sessions/${sessionId}/reports`,
        body,
    );
    return data;
};
