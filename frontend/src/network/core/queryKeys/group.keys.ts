export const groupKeys = {
    all: ['groups'] as const,
    detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
};