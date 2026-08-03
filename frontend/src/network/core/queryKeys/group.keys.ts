export const groupKeys = {
    all: ['groups'] as const,
    list: (classId: number) => [...groupKeys.all, 'list', { classId }] as const,
    mine: (classId: number) => [...groupKeys.all, 'mine', { classId }] as const,
    detail: (groupId: number) => [...groupKeys.all, 'detail', groupId] as const,
    detailFull: (groupId: number) => [...groupKeys.detail(groupId), 'full'] as const,
    candidates: (classId: number) => [...groupKeys.all, 'candidates', { classId }] as const,
};
