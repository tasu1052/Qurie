import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuiz } from '../quiz/quiz';
import { queryKeys } from '../core/queryKeys';

export const useCreateQuiz = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuiz,
        onSuccess: (_, { project }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.byProject(project) });
        },
    });
};