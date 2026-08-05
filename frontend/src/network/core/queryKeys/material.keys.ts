export const materialKeys = {
    all: ['materials'] as const,
    byClass: (classId: number) => [...materialKeys.all, 'class', classId] as const,
};
