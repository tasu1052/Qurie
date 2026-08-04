import { axiosInstance } from '../core/axiosInstance';
import { normalizeQuizQuestions, normalizeQuizSetDetail } from './quiz-normalize';

export type QuizGenerationMode = 'ASSESSMENT' | 'PRACTICE';
export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK';
export type QuizPurpose = 'CONCEPTUAL' | 'MICRO';
export type QuizDifficulty = 'EASY' | 'NORMAL' | 'HARD';
/** 백엔드 COMPLETED ↔ AI READY. normalize 가 READY 를 COMPLETED 로 맞춘다. */
export type QuizSetStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface QuizGenerateRequest {
    mode: QuizGenerationMode;
    count: number;
    ratioEasy: number;
    ratioNormal: number;
    ratioHard: number;
    userPrompt?: string;
    versionHash: string;
    targetFiles?: string[];
    files: Record<string, string>;
}

export interface QuizGenerateResponse {
    quizSetId: number;
    status: QuizSetStatus;
    requestedCount: number;
}

export interface QuizChoiceItem {
    idx: number;
    content: string;
    answer: boolean;
}

export interface QuizItem {
    id: number;
    type: QuizType;
    purpose: QuizPurpose;
    difficulty: QuizDifficulty;
    testedConcept: string;
    question: string;
    explanation: string;
    filePath: string;
    lineStart: number | null;
    lineEnd: number | null;
    timeLimitSec: number;
    orderNo: number;
    choices: QuizChoiceItem[];
}

export interface QuizSetDetailResponse {
    quizSetId: number;
    status: QuizSetStatus;
    generationStage: string | null;
    requestedCount: number;
    generatedCount: number;
    errorMessage: string | null;
    quizzes: QuizItem[];
}

export interface QuizQuestionChoiceItem {
    idx: number;
    content: string;
}

export interface QuizQuestionItem {
    id: number;
    type: QuizType;
    difficulty: QuizDifficulty;
    testedConcept: string;
    question: string;
    filePath: string;
    lineStart: number | null;
    lineEnd: number | null;
    timeLimitSec: number;
    orderNo: number;
    choices: QuizQuestionChoiceItem[];
}

/** 학생 응시용 — 정답·해설 없음. */
export interface QuizQuestionsResponse {
    quizSetId: number;
    status: QuizSetStatus;
    generationStage: string | null;
    requestedCount: number;
    quizzes: QuizQuestionItem[];
}

export interface QuizSetSummaryResponse {
    quizSetId: number;
    status: QuizSetStatus;
    requestedCount: number;
    generatedCount: number;
    errorMessage: string | null;
    satisfactionRating: number | null;
}

export interface QuizSatisfactionRequest {
    rating: number;
    comment?: string;
}

export const generateQuiz = async (
    projectId: number,
    body: QuizGenerateRequest,
): Promise<QuizGenerateResponse> => {
    const { data } = await axiosInstance.post<QuizGenerateResponse>('/quiz', body, {
        params: { project: projectId },
        timeout: 45_000,
    });
    return {
        ...data,
        status: data.status === ('READY' as QuizSetStatus) ? 'COMPLETED' : data.status,
    };
};

export const listQuizSetsByProject = async (
    projectId: number,
): Promise<QuizSetSummaryResponse[]> => {
    const { data } = await axiosInstance.get<QuizSetSummaryResponse[]>('/quiz', {
        params: { project: projectId },
    });
    return (data ?? []).map((item) => ({
        ...item,
        status: item.status === ('READY' as QuizSetStatus) ? 'COMPLETED' : item.status,
    }));
};

export const getQuizSet = async (quizSetId: number): Promise<QuizSetDetailResponse> => {
    const { data } = await axiosInstance.get<unknown>(`/quiz/${quizSetId}`);
    return normalizeQuizSetDetail(data);
};

export const getQuizQuestions = async (quizSetId: number): Promise<QuizQuestionsResponse> => {
    const { data } = await axiosInstance.get<unknown>(`/quiz/${quizSetId}/questions`);
    return normalizeQuizQuestions(data);
};

export const submitQuizSatisfaction = async (
    quizSetId: number,
    body: QuizSatisfactionRequest,
): Promise<QuizSetSummaryResponse> => {
    const { data } = await axiosInstance.post<QuizSetSummaryResponse>(
        `/quiz/${quizSetId}/satisfaction`,
        body,
    );
    return data;
};

export type QuizProgressStatus = 'ATTEMPTED' | 'SKIPPED' | 'TIMEOUT';

export interface QuizProgressSubmitRequest {
    status: QuizProgressStatus;
    chosenChoiceIdx?: number | null;
    startedAt: string;
    finishedAt: string;
}

export interface QuizProgressResponse {
    id: number;
    quizId: number;
    status: QuizProgressStatus;
    chosenChoiceIdx: number | null;
    isCorrect: boolean | null;
    elapsedMs: number;
    explanation: string | null;
    correctChoiceIdx: number | null;
}

export interface QuizProgressItem {
    quizId: number;
    status: QuizProgressStatus;
    chosenChoiceIdx: number | null;
    isCorrect: boolean | null;
    elapsedMs: number;
    explanation: string | null;
    correctChoiceIdx: number | null;
}

export interface QuizProgressSummaryResponse {
    quizSetId: number;
    totalCount: number;
    attemptedCount: number;
    correctCount: number;
    items: QuizProgressItem[];
}

export const submitQuizProgress = async (
    quizSetId: number,
    quizId: number,
    body: QuizProgressSubmitRequest,
): Promise<QuizProgressResponse> => {
    const { data } = await axiosInstance.post<QuizProgressResponse>(
        `/quiz/${quizSetId}/questions/${quizId}/progress`,
        body,
    );
    return data;
};

export const getQuizProgress = async (
    quizSetId: number,
): Promise<QuizProgressSummaryResponse> => {
    const { data } = await axiosInstance.get<QuizProgressSummaryResponse>(
        `/quiz/${quizSetId}/progress`,
    );
    return {
        ...data,
        items: (data.items ?? []).map((item) => ({
            quizId: item.quizId,
            status: item.status,
            chosenChoiceIdx: item.chosenChoiceIdx ?? null,
            isCorrect: item.isCorrect ?? null,
            elapsedMs: item.elapsedMs ?? 0,
            explanation: item.explanation ?? null,
            correctChoiceIdx: item.correctChoiceIdx ?? null,
        })),
    };
};
