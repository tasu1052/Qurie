import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createUserReport,
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
