import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createUserReport,
    downloadSessionReportPdf,
    downloadUserReportPdf,
    getUserReport,
    getUserSessionReports,
    type UserReportCreateRequest,
} from './report-apis';

export const useCreateUserReport = () => {
    return useMutation({
        mutationFn: ({
            userId,
            ...body
        }: UserReportCreateRequest & { userId: number }) => createUserReport(userId, body),
    });
};

export const useGetUserSessionReports = (userId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.users.sessionReports(userId),
        queryFn: () => getUserSessionReports(userId),
    });
};

export const useGetUserReport = (userId: number, classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.users.reportSummary(userId, classId),
        queryFn: () => getUserReport(userId, classId),
    });
};

export const useDownloadUserReportPdf = () => {
    return useMutation({
        mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
            downloadUserReportPdf(userId, classId),
    });
};

export const useDownloadSessionReportPdf = () => {
    return useMutation({
        mutationFn: ({ sessionId, userId }: { sessionId: number; userId: number }) =>
            downloadSessionReportPdf(sessionId, userId),
    });
};
