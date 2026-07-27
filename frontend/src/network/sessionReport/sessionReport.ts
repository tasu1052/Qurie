import { axiosInstance } from '../core/axiosInstance';

export interface CreateSessionReportRequest {
    session: string;
    userId: string;
}

export interface SessionReport {
    id: string;
    session: string;
    userId: string;
}

export const createSessionReport = async (body: CreateSessionReportRequest): Promise<SessionReport> => {
    const { data } = await axiosInstance.post<SessionReport>('/session-report', body);
    return data;
};