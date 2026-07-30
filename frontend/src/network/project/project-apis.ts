import { axiosInstance } from '../core/axiosInstance';

export interface ProjectCreateRequest {
    sessionId: number;
    path?: string;
    importedBy: number;
}

export interface ProjectResponse {
    id: number;
    sessionId: number;
    path: string | null;
    importedBy: number;
    createdAt: string;
    updatedAt: string;
}

export const createProject = async (body: ProjectCreateRequest): Promise<ProjectResponse> => {
    const { data } = await axiosInstance.post<ProjectResponse>('/projects', body);
    return data;
};
