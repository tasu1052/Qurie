import { useSuspenseQuery } from '@tanstack/react-query';
import { getTracks } from './track';
import { queryKeys } from '../core/queryKeys';
import type { ListParams } from '../core/types';

export const useGetTracks = (filters: ListParams & { tech?: string } = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.tracks.list(filters),
        queryFn: () => getTracks(filters),
    });
};