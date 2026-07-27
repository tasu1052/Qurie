import { axiosInstance } from '../core/axiosInstance';

export interface CreateGroupRequest {
    name: string;
    class: string;
}

export interface Group {
    id: number;
    name: string;
    class: string;
}

export const createGroup = async (body: CreateGroupRequest): Promise<Group> => {
    const { data } = await axiosInstance.post<Group>('/group', body);
    return data;
};