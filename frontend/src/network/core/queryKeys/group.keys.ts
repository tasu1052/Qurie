export const groupKeys = {
    all: ['groups'] as const,
    list: (classId: number) => [...groupKeys.all, 'list', { classId }] as const,
    detail: (groupId: number) => [...groupKeys.all, 'detail', groupId] as const,
};
