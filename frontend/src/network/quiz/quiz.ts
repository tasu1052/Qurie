import { axiosInstance } from '../core/axiosInstance';

export interface CreateQuizRequest {
    title: string;
    project: string;
}

export interface Quiz {
    id: string;
    title: string;
    project: string;
}

export const createQuiz = async (body: CreateQuizRequest): Promise<Quiz> => {
    const { data } = await axiosInstance.post<Quiz>('/quiz', body);
    return data;
};