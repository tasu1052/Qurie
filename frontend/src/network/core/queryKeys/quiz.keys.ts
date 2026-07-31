export const quizKeys = {
    all: ['quiz'] as const,
    detail: (quizSetId: number) => [...quizKeys.all, 'detail', quizSetId] as const,
};
