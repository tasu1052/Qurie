export const queryKeys = {
    auth: {
        all: ['auth'] as const,
    },

    track: {
        all: ['track'] as const,
        list: () => [...queryKeys.track.all, 'list'] as const,
    },
}