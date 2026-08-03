import { axiosInstance } from '../core/axiosInstance';

export interface UserReportCreateRequest {
    classId: number;
    sessionCount: number;
    quizTotalCount: number;
    quizAttemptedCount: number;
    quizCorrectCount: number;
    quizSkippedCount: number;
    completionRate: number;
    accuracy: number;
    avgElapsedMs?: number;
    difficultyRatio?: Record<string, unknown>;
    conceptStats?: Record<string, unknown>;
    rating?: number;
    ratingFormulaVersion?: string;
}

export interface UserReportCreateResponse {
    userReportId: number;
    ordinaryUserId: number;
    classId: number;
    issuedAt: string;
}

export interface SessionReportSummaryResponse {
    sessionReportId: number;
    sessionId: number;
    sessionTitle: string;
    accuracy: number | null;
    quizRating: number | null;
    completionRate: number | null;
    issuedAt: string | null;
}

export const createUserReport = async (
    userId: number,
    body: UserReportCreateRequest,
): Promise<UserReportCreateResponse> => {
    const { data } = await axiosInstance.post<UserReportCreateResponse>(
        `/users/${userId}/report-summary`,
        body,
    );
    return data;
};

export const getUserSessionReports = async (
    userId: number,
): Promise<SessionReportSummaryResponse[]> => {
    const { data } = await axiosInstance.get<SessionReportSummaryResponse[]>(
        `/users/${userId}/session-reports`,
    );
    return data;
};
