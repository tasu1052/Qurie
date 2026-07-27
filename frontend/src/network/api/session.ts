import { axiosInstance } from '../axiosInstance';

export interface CreateSessionRequest {
    title: string;
    class: string;
}

export interface Session {
    id: string;
    title: string;
    class: string;
}

export const createSession = async (body: CreateSessionRequest): Promise<Session> => {
    const { data } = await axiosInstance.post<Session>('/session', body);
    return data;
};