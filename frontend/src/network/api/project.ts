import { axiosInstance } from '../axiosInstance';

export interface CreateProjectRequest {
    title: string;
    session: string;
}

export interface Project {
    id: string;
    title: string;
    session: string;
}

export const createProject = async (body: CreateProjectRequest): Promise<Project> => {
    const { data } = await axiosInstance.post<Project>('/project', body);
    return data;
};