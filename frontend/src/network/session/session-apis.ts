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
    /** 그룹 세션이면 그룹 이름. 반 공개이거나 그룹이 없으면 null. */
    groupName?: string | null;
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

/**
 * userId 를 주면 그 학생 기준(반 공개 + 그 학생 그룹의 세션)으로 걸러진다 — 본인 외 지정은 매니저/마스터만.
 * includeEnded 는 종료된 세션까지 포함한다(세션 목록의 지난 세션 표시용, 기본 false).
 */
export const getSessions = async (
    classId: number,
    opts: { userId?: number; includeEnded?: boolean } = {},
): Promise<SessionResponse[]> => {
    const { data } = await axiosInstance.get<SessionResponse[]>('/sessions', {
        params: {
            classId,
            ...(opts.userId != null ? { userId: opts.userId } : {}),
            ...(opts.includeEnded ? { activeOnly: false } : {}),
        },
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
    // 요청에 aiComment 가 없으면 서버가 AI 코멘트를 동기 생성하므로 기본 타임아웃(10s)보다 길게 기다린다.
    const { data } = await axiosInstance.post<SessionReportCreateResponse>(
        `/sessions/${sessionId}/reports`,
        body,
        { timeout: 120_000 },
    );
    return data;
};

export interface SessionReportBulkResponse {
    sessionId: number;
    issuedCount: number;
}

export interface SessionReportRosterItemResponse {
    sessionReportId: number;
    ordinaryUserId: number;
    userName: string;
    accuracy: number | null;
    quizRating: number | null;
    completionRate: number | null;
    issuedAt: string | null;
}

export interface SessionReportRosterResponse {
    sessionId: number;
    sessionTitle: string;
    issuedCount: number;
    avgAccuracy?: number | null;
    avgCompletionRate?: number | null;
    reports: SessionReportRosterItemResponse[];
}

/**
 * 세션 참가 학생 전원의 리포트를 한 번에 발급한다(기존 리포트는 갈아엎고 재발급 — 409 없음).
 * 강사(MANAGER/MASTER) 전용. 학생마다 AI 코멘트를 동기 생성하느라 오래 걸릴 수 있어 타임아웃을 크게 늘린다.
 */
export const createSessionReportsForAll = async (
    sessionId: number,
): Promise<SessionReportBulkResponse> => {
    const { data } = await axiosInstance.post<SessionReportBulkResponse>(
        `/sessions/${sessionId}/reports/all`,
        undefined,
        { timeout: 300_000 },
    );
    return data;
};

export const updateSessionReportManagerComment = async (
    sessionId: number,
    userId: number,
    comment: string,
): Promise<SessionReportDetailResponse> => {
    const { data } = await axiosInstance.patch<SessionReportDetailResponse>(
        `/sessions/${sessionId}/reports/${userId}/manager-comment`,
        { comment },
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

/** 세션에 발급된 학생 리포트 전체 명단(강사 전용). */
export const getSessionReportRoster = async (
    sessionId: number,
): Promise<SessionReportRosterResponse> => {
    const { data } = await axiosInstance.get<SessionReportRosterResponse>(
        `/sessions/${sessionId}/reports/roster`,
    );
    return data;
};
