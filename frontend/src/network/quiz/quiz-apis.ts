import { axiosInstance } from '../core/axiosInstance';

export type QuizGenerationMode = 'INITIAL' | 'REVIEW';
export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK';
export type QuizSetStatus = 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface QuizGenerateRequest {
    mode: QuizGenerationMode;
    snapshotId?: number;
    count: number;
    types: QuizType[];
    ratioEasy: number;
    ratioNormal: number;
    ratioHard: number;
    userPrompt?: string;
    createdBy: number;
}

export interface QuizGenerateResponse {
    quizSetId: number;
    status: QuizSetStatus;
    requestedCount: number;
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
