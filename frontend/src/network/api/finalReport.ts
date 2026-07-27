import { axiosInstance } from '../axiosInstance';

export interface CreateFinalReportRequest {
    userId: string;
}

export interface FinalReport {
    id: string;
    userId: string;
}

export const createFinalReport = async (body: CreateFinalReportRequest): Promise<FinalReport> => {
    const { data } = await axiosInstance.post<FinalReport>('/final-report', body);
    return data;
};