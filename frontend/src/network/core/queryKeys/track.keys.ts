import type { ListParams } from '../types';

export type TrackListFilters = ListParams & {
    tech?: string;
};

export const trackKeys = {
    all: ['tracks'] as const,
    list: (filters: TrackListFilters = {}) => [...trackKeys.all, 'list', filters] as const,
    detail: (trackId: number) => [...trackKeys.all, 'detail', trackId] as const,
};
