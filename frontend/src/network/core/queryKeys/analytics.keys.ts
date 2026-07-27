export const analyticsKeys = {
    all: ['analytics'] as const,
    overview: () => [...analyticsKeys.all, 'overview'] as const,
    track: (id: number, from?: string, to?: string) =>
      [...analyticsKeys.all, 'tracks', id, { from, to }] as const,
    class: (id: number, filters?: { metric?: string; dimension?: string; from?: string; to?: string }) =>
      [...analyticsKeys.all, 'classes', id, filters ?? {}] as const,
};