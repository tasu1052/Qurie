import { axiosInstance } from '../core/axiosInstance';

export interface AnalyticsOverviewResponse {
    trackCount: number;
    activeClassCount: number;
    managerCount: number;
    studentCount: number;
}

export interface ClassAnalyticsResponse {
    classId: number;
    studentCount: number;
    managerCount: number;
    groupCount: number;
    sessionCount: number;
    activeSessionCount: number;
    reportedStudentCount: number;
    avgAccuracy: number | null;
    avgCompletionRate: number | null;
    avgElapsedMs: number | null;
}

export const getAnalyticsOverview = async (): Promise<AnalyticsOverviewResponse> => {
    const { data } = await axiosInstance.get<AnalyticsOverviewResponse>('/analytics/overview');
    return data;
};

export const getClassAnalytics = async (classId: number): Promise<ClassAnalyticsResponse> => {
    const { data } = await axiosInstance.get<ClassAnalyticsResponse>(
        `/analytics/classes/${classId}`,
    );
    return data;
};
