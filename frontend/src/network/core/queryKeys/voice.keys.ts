export const voiceKeys = {
    all: ['voice'] as const,
    participants: (sessionId: number) => [...voiceKeys.all, 'participants', sessionId] as const,
};
