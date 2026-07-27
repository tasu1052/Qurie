import { axiosInstance } from '../core/axiosInstance';

export interface CreateClassRequest {
    name: string;
    track: string;
}

export interface ClassItem {
    id: number;
    name: string;
    track: string;
}

export const createClass = async (body: CreateClassRequest): Promise<ClassItem> => {
    const { data } = await axiosInstance.post<ClassItem>('/class', body);
    return data;
};