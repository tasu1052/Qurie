import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
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

/** Non-suspense poller for quiz generation progress. */
export const usePollQuizSet = (quizSetId: number | null) => {
    return useQuery({
        queryKey: quizSetId != null ? queryKeys.quiz.detail(quizSetId) : (['quiz', 'idle'] as const),
        queryFn: () => getQuizSet(quizSetId as number),
        enabled: quizSetId != null,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'QUEUED' || status === 'GENERATING' ? 2000 : false;
        },
    });
};
