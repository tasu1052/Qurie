import { axiosInstance } from '../core/axiosInstance';
import type { ChatMessageListParams } from '../core/queryKeys/session.keys';
import type { UserRole } from '../core/types';

export type { ChatMessageListParams };

export interface SessionCreateRequest {
    classId: number;
    title: string;
    /** 일반 세션 필수. classPublic:true 이면 보내지 않음 */
    groupId?: number;
    /** 반 공개(수업) 세션. true 는 MANAGER 만 가능(403). 생략/false 는 일반 세션. */
    classPublic?: boolean;
}

export interface SessionUpdateRequest {
    title?: string;
    active?: boolean;
}

export interface SessionResponse {
    id: number;
    classId: number;
    groupId: number | null;
    title: string;
    createdBy: number;
    active: boolean;
    /** 반 공개(수업) 세션 여부. 반당 active public 세션은 하나. */
    classPublic: boolean;
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

/** 정량 지표는 서버가 quiz_progress 에서 집계하므로 발급 대상과 정성 항목만 보낸다. */
export interface SessionReportCreateRequest {
    ordinaryUserId: number;
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

export interface SessionReportDetailResponse {
    sessionReportId: number;
    sessionId: number;
    sessionTitle: string;
    ordinaryUserId: number;
    userName: string;
    quizSetId: number | null;
    quizTotalCount: number;
    quizAttemptedCount: number;
    quizCorrectCount: number;
    quizSkippedCount: number;
    completionRate: number | null;
    accuracy: number | null;
    avgElapsedMs: number | null;
    difficultyRatio: Record<string, unknown> | null;
    conceptStats: Record<string, unknown> | null;
    quizRating: number | null;
    aiComment: string | null;
    aiStrengths: string[] | null;
    aiImprovements: string[] | null;
    managerComment: string | null;
    issuedAt: string | null;
}

export const createSession = async (body: SessionCreateRequest): Promise<SessionResponse> => {
    const { data } = await axiosInstance.post<SessionResponse>('/sessions', {
        classId: body.classId,
        title: body.title,
        ...(body.classPublic ? { classPublic: true } : { groupId: body.groupId }),
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

export const getSessionReport = async (
    sessionId: number,
    userId?: number,
): Promise<SessionReportDetailResponse> => {
    const { data } = await axiosInstance.get<SessionReportDetailResponse>(
        `/sessions/${sessionId}/reports`,
        { params: userId != null ? { userId } : undefined },
    );
    return data;
};
