import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrack } from './track';
import { queryKeys } from '../core/queryKeys';

export const useCreateTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTrack,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
        },
    });
};