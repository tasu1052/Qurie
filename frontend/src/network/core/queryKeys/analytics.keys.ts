export const analyticsKeys = {
    all: ['analytics'] as const,
    overview: () => [...analyticsKeys.all, 'overview'] as const,
};
