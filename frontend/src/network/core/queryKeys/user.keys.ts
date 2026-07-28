export const userKeys = {
    all: ['users'] as const,
    detail: (userId: number) => [...userKeys.all, 'detail', userId] as const
}