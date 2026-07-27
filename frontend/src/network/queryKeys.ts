export const queryKeys = {
    auth: {
        all: ['auth'] as const,
    },
    track: {
        all: ['track'] as const,
        list: () => [...queryKeys.track.all, 'list'] as const,
    },
    class: {
        all: ['class'] as const,
        byTrack: (track: string) => [...queryKeys.class.all, track] as const,
    }
}