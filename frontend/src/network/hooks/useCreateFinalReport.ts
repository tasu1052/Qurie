import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFinalReport } from '../api/finalReport';
import { queryKeys } from '../queryKeys';

export const useCreateFinalReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFinalReport,
        onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.finalReport.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.finalReport.byUser(userId) });
        },
    });
};