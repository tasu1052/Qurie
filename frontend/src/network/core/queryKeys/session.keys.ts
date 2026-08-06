export type ChatMessageListParams = {
    beforeId?: number;
    size?: number;
};

export const sessionKeys = {
    all: ['sessions'] as const,
    list: (classId: number, includeEnded = false) =>
        [...sessionKeys.all, 'list', { classId, includeEnded }] as const,
    detail: (sessionId: number) => [...sessionKeys.all, 'detail', sessionId] as const,
    participants: (sessionId: number) =>
        [...sessionKeys.detail(sessionId), 'participants'] as const,
    messages: (sessionId: number, params: ChatMessageListParams = {}) =>
        [...sessionKeys.detail(sessionId), 'messages', params] as const,
    report: (sessionId: number, userId?: number) =>
        [...sessionKeys.detail(sessionId), 'report', { userId: userId ?? 'me' }] as const,
    reportRoster: (sessionId: number) =>
        [...sessionKeys.detail(sessionId), 'report-roster'] as const,
};