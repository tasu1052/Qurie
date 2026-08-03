export const analyticsKeys = {
    all: ['analytics'] as const,
    overview: () => [...analyticsKeys.all, 'overview'] as const,
    classDetail: (classId: number) => [...analyticsKeys.all, 'class', classId] as const,
};
