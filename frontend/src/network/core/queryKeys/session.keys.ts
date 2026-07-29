export const sessionKeys = {
    all: ['sessions'] as const,
    list: (classId: number) => [...sessionKeys.all, 'list', { classId }] as const,
    detail: (sessionId: number) => [...sessionKeys.all, 'detail', sessionId] as const,
    participants: (sessionId: number) =>
        [...sessionKeys.detail(sessionId), 'participants'] as const,
};