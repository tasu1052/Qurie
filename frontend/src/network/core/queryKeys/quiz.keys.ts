export const quizKeys = {
    all: ['quiz'] as const,
    byProject: (projectId: number) => [...quizKeys.all, 'project', projectId] as const,
    detail: (quizSetId: number) => [...quizKeys.all, 'detail', quizSetId] as const,
    questions: (quizSetId: number) => [...quizKeys.all, 'questions', quizSetId] as const,
    progress: (quizSetId: number, userId?: number | null) =>
        [...quizKeys.all, 'progress', quizSetId, userId ?? 'me'] as const,
    progressRoster: (quizSetId: number) => [...quizKeys.all, 'progressRoster', quizSetId] as const,
    progressIncorrect: (quizSetId: number) =>
        [...quizKeys.all, 'progressIncorrect', quizSetId] as const,
    mySatisfaction: (quizSetId: number) =>
        [...quizKeys.all, 'satisfaction', 'me', quizSetId] as const,
};
