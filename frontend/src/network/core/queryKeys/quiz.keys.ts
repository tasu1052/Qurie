export const quizSetKeys = {
    all: ['quiz-sets'] as const,
    detail: (id: number) => [...quizSetKeys.all, 'detail', id] as const,
    quizzes: (id: number) => [...quizSetKeys.detail(id), 'quizzes'] as const,
    progress: (id: number, userId?: number | 'me') =>
      [...quizSetKeys.detail(id), 'progress', userId ?? 'me'] as const,
    stats: (id: number) => [...quizSetKeys.detail(id), 'stats'] as const,
};
  
export const quizKeys = {
    all: ['quizzes'] as const,
    detail: (id: number) => [...quizKeys.all, 'detail', id] as const,
};