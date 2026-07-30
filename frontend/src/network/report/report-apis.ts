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

export const createUserReport = async (
    userId: number,
    body: UserReportCreateRequest,
): Promise<UserReportCreateResponse> => {
    const { data } = await axiosInstance.post<UserReportCreateResponse>(
        `/v1/users/${userId}/report-summary`,
        body,
    );
    return data;
};
