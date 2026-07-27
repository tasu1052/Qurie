import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSessionReport } from '../sessionReport/sessionReport';
import { queryKeys } from '../core/queryKeys';

export const useCreateSessionReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSessionReport,
        onSuccess: (_, { session, userId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessionReport.all });
        queryClient.invalidateQueries({
            queryKey: queryKeys.sessionReport.detail(session, userId),
        });
        },
    });
};