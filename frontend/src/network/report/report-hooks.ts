import { useMutation } from '@tanstack/react-query';
import { createUserReport, type UserReportCreateRequest } from './report-apis';

export const useCreateUserReport = () => {
    return useMutation({
        mutationFn: ({
            userId,
            ...body
        }: UserReportCreateRequest & { userId: number }) => createUserReport(userId, body),
    });
};
