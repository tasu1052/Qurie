import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import type { TrackListFilters } from '../core/queryKeys/track.keys';
import {
    createTrack,
    deleteTrack,
    getTrack,
    getTracks,
    updateTrack,
    type TrackCreateRequest,
    type TrackUpdateRequest,
} from './track-apis';

export const useGetTracks = (filters: TrackListFilters = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.tracks.list(filters),
        queryFn: () => getTracks(filters),
    });
};

export const useGetTrack = (trackId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.tracks.detail(trackId),
        queryFn: () => getTrack(trackId),
    });
};

export const useCreateTrack = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: TrackCreateRequest) => createTrack(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
        },
    });
};

export const useUpdateTrack = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ trackId, ...body }: TrackUpdateRequest & { trackId: number }) =>
            updateTrack(trackId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tracks.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
        },
    });
};

export const useDeleteTrack = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ trackId }: { trackId: number }) => deleteTrack(trackId),
        onSuccess: (_, { trackId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tracks.detail(trackId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
        },
    });
};
