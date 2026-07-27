export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: number) => [...projectKeys.all, 'detail', id] as const,
    files: (id: number, path: string) => [...projectKeys.detail(id), 'files', path] as const,
    quizSets: (id: number) => [...projectKeys.detail(id), 'quiz-sets'] as const,
    snapshots: (id: number) => [...projectKeys.detail(id), 'snapshots'] as const,
};