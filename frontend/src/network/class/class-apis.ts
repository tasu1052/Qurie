import { axiosInstance } from '../core/axiosInstance';

export interface ClassCreateRequest {
    trackId: number;
    classNumber: number;
    name: string;
    capacity?: number;
    description?: string;
    startedAt?: string;
    endedAt?: string;
}

export interface ClassResponse {
    id: number;
    trackId: number;
    classNumber: number;
    name: string;
    capacity: number | null;
    description: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getMyClasses = async (): Promise<ClassResponse[]> => {
    const { data } = await axiosInstance.get<ClassResponse[]>('/classes/me');
    return data;
};

export const createClass = async (body: ClassCreateRequest): Promise<ClassResponse> => {
    const { data } = await axiosInstance.post<ClassResponse>('/classes', body);
    return data;
};
