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
    },
    invitation: {
        all: ['invitation'] as const,
        byRole: (role: 'manager' | 'member') => [...queryKeys.invitation.all, role] as const,
    },
    group: {
        all: ['group'] as const,
        byClass: (className: string) => [...queryKeys.group.all, className] as const,
    },
}