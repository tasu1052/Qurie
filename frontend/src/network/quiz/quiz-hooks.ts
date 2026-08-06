import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    generateQuiz,
    getQuizProgress,
    getQuizQuestions,
    getQuizSet,
    listQuizSetsByProject,
    submitQuizProgress,
    submitQuizSatisfaction,
    type QuizGenerateRequest,
    type QuizProgressSubmitRequest,
    type QuizSatisfactionRequest,
} from './quiz-apis';

export const useGenerateQuiz = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            ...body
        }: QuizGenerateRequest & { projectId: number }) => generateQuiz(projectId, body),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.quiz.detail(data.quizSetId) });
            queryClient.invalidateQueries({
                queryKey: queryKeys.quiz.byProject(variables.projectId),
            });
        },
    });
};

/** 프로젝트 퀴즈셋 목록 — 새로고침 복원용. */
export const useQuizSetsByProject = (projectId: number | null) => {
    return useQuery({
        queryKey: projectId != null ? queryKeys.quiz.byProject(projectId) : (['quiz', 'project', 'idle'] as const),
        queryFn: () => listQuizSetsByProject(projectId as number),
        enabled: projectId != null,
        staleTime: 5_000,
    });
};

export const useGetQuizSet = (quizSetId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.quiz.detail(quizSetId),
        queryFn: () => getQuizSet(quizSetId),
    });
};

/** Non-suspense poller for quiz generation progress (MANAGER — 정답 포함). */
export const usePollQuizSet = (quizSetId: number | null) => {
    return useQuery({
        queryKey: quizSetId != null ? queryKeys.quiz.detail(quizSetId) : (['quiz', 'idle'] as const),
        queryFn: () => getQuizSet(quizSetId as number),
        enabled: quizSetId != null,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'QUEUED' || status === 'GENERATING' ? 2000 : false;
        },
    });
};

export const useGetQuizQuestions = (quizSetId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.quiz.questions(quizSetId),
        queryFn: () => getQuizQuestions(quizSetId),
    });
};

/** Non-suspense poller for student quiz view (정답·해설 없음). */
export const usePollQuizQuestions = (quizSetId: number | null) => {
    return useQuery({
        queryKey:
            quizSetId != null ? queryKeys.quiz.questions(quizSetId) : (['quiz', 'questions', 'idle'] as const),
        queryFn: () => getQuizQuestions(quizSetId as number),
        enabled: quizSetId != null,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'QUEUED' || status === 'GENERATING' ? 2000 : false;
        },
    });
};

export const useSubmitQuizSatisfaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            quizSetId,
            ...body
        }: QuizSatisfactionRequest & { quizSetId: number }) =>
            submitQuizSatisfaction(quizSetId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.quiz.detail(data.quizSetId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.quiz.all });
        },
    });
};

export const useSubmitQuizProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            quizSetId,
            quizId,
            ...body
        }: QuizProgressSubmitRequest & { quizSetId: number; quizId: number }) =>
            submitQuizProgress(quizSetId, quizId, body),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.quiz.progress(variables.quizSetId),
            });
        },
    });
};

/** 세션 재입장 시 본인 응시 기록 복원. userId 를 주면 해당 학생 기록(강사 조회). */
export const useGetQuizProgress = (quizSetId: number | null, userId?: number | null) => {
    return useQuery({
        queryKey:
            quizSetId != null
                ? queryKeys.quiz.progress(quizSetId, userId)
                : (['quiz', 'progress', 'idle'] as const),
        queryFn: () => getQuizProgress(quizSetId as number, userId),
        enabled: quizSetId != null,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });
};

/** 세션 리포트 등 Suspense 경계 안에서 응시 기록을 읽을 때. */
export const useGetQuizProgressSuspense = (quizSetId: number, userId?: number | null) => {
    return useSuspenseQuery({
        queryKey: queryKeys.quiz.progress(quizSetId, userId),
        queryFn: () => getQuizProgress(quizSetId, userId),
    });
};
