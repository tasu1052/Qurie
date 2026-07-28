export const sessionKeys = {
    all: ['sessions'] as const,
    lists: () => [...sessionKeys.all, 'list'] as const,
    list: (classId: number) => [...sessionKeys.lists(), { classId }] as const,
    detail: (id: number) => [...sessionKeys.all, 'detail', id] as const,
};