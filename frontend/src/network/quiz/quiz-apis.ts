import { axiosInstance } from '../core/axiosInstance';

export type QuizGenerationMode = 'ASSESSMENT' | 'PRACTICE';
export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK';
export type QuizPurpose = 'CONCEPTUAL' | 'MICRO';
export type QuizDifficulty = 'EASY' | 'NORMAL' | 'HARD';
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

export const generateQuiz = async (
    projectId: number,
    body: QuizGenerateRequest,
): Promise<QuizGenerateResponse> => {
    const { data } = await axiosInstance.post<QuizGenerateResponse>('/quiz', body, {
        params: { project: projectId },
    });
    return data;
};

export const getQuizSet = async (quizSetId: number): Promise<QuizSetDetailResponse> => {
    const { data } = await axiosInstance.get<QuizSetDetailResponse>(`/quiz/${quizSetId}`);
    return data;
};

export const getQuizQuestions = async (quizSetId: number): Promise<QuizQuestionsResponse> => {
    const { data } = await axiosInstance.get<QuizQuestionsResponse>(`/quiz/${quizSetId}/questions`);
    return data;
};
