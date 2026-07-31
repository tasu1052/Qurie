import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { generateQuiz, getQuizSet, type QuizGenerateRequest } from './quiz-apis';

export const useGenerateQuiz = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            ...body
        }: QuizGenerateRequest & { projectId: number }) => generateQuiz(projectId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.quiz.detail(data.quizSetId) });
        },
    });
};

export const useGetQuizSet = (quizSetId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.quiz.detail(quizSetId),
        queryFn: () => getQuizSet(quizSetId),
    });
};
