export const commentKeys = {
  all: ['comments'] as const,
  byUser: (userId: number, classId?: number | null) =>
    [...commentKeys.all, 'user', userId, { classId: classId ?? null }] as const,
};
