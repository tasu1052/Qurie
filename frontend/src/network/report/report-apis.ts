import { axiosInstance } from '../core/axiosInstance';

/** 정량 지표는 서버가 세션 리포트들을 합산해 계산하므로 클래스와 평점만 보낸다. */
export interface UserReportCreateRequest {
    classId: number;
    rating?: number;
    ratingFormulaVersion?: string;
}

export interface UserReportDetailResponse {
    userReportId: number;
    ordinaryUserId: number;
    userName: string;
    classId: number;
    sessionCount: number;
    quizTotalCount: number;
    quizAttemptedCount: number;
    quizCorrectCount: number;
    quizSkippedCount: number;
    completionRate: number | null;
    accuracy: number | null;
    avgElapsedMs: number | null;
    difficultyRatio: Record<string, unknown> | null;
    conceptStats: Record<string, unknown> | null;
    rating: number | null;
    ratingFormulaVersion: string | null;
    issuedAt: string | null;
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

export const getUserReport = async (
    userId: number,
    classId: number,
): Promise<UserReportDetailResponse> => {
    const { data } = await axiosInstance.get<UserReportDetailResponse>(
        `/users/${userId}/report-summary`,
        { params: { classId } },
    );
    return data;
};
