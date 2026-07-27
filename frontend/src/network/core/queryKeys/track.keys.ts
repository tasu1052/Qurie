import type { ListParams } from '../types';

export const trackKeys = {
    all: ['tracks'] as const,
    lists: () => [...trackKeys.all, 'list'] as const,
    list: (filters: ListParams & { tech?: string }) => [...trackKeys.lists(), filters] as const,
    detail: (id: number) => [...trackKeys.all, 'detail', id] as const,
    classes: (trackId: number, filters?: ListParams) =>
        [...trackKeys.detail(trackId), 'classes', filters ?? {}] as const,
    managers: (trackId: number) => [...trackKeys.detail(trackId), 'managers'] as const,
};