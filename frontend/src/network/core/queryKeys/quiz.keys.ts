export const quizKeys = {
    all: ['quiz'] as const,
    detail: (quizSetId: number) => [...quizKeys.all, 'detail', quizSetId] as const,
    questions: (quizSetId: number) => [...quizKeys.all, 'questions', quizSetId] as const,
};
