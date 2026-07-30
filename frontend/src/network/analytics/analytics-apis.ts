import { axiosInstance } from '../core/axiosInstance';

export interface AnalyticsOverviewResponse {
    trackCount: number;
    activeClassCount: number;
    managerCount: number;
    studentCount: number;
}

export const getAnalyticsOverview = async (): Promise<AnalyticsOverviewResponse> => {
    const { data } = await axiosInstance.get<AnalyticsOverviewResponse>('/analytics/overview');
    return data;
};
