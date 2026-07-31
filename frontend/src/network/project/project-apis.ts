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

export interface ProjectImportLocalRequest {
    sessionId: number;
    files: Record<string, string>;
}

export interface ProjectImportGitRequest {
    sessionId: number;
    repoUrl: string;
    branch?: string;
    subPath?: string;
}

export interface ProjectSkippedFileResponse {
    path: string;
    reason: string;
}

export interface ProjectImportResponse {
    projectId: number;
    sessionId: number;
    fileCount: number;
    versionHash: string;
    skippedFiles: ProjectSkippedFileResponse[];
}

export interface ProjectFileSummaryResponse {
    path: string;
    size: number;
}

export interface ProjectFileContentResponse {
    path: string;
    content: string;
}

export const createProject = async (body: ProjectCreateRequest): Promise<ProjectResponse> => {
    const { data } = await axiosInstance.post<ProjectResponse>('/projects', body);
    return data;
};

export const importProjectLocal = async (
    body: ProjectImportLocalRequest,
): Promise<ProjectImportResponse> => {
    const { data } = await axiosInstance.post<ProjectImportResponse>('/projects/import/local', body);
    return data;
};

export const importProjectGit = async (
    body: ProjectImportGitRequest,
): Promise<ProjectImportResponse> => {
    const { data } = await axiosInstance.post<ProjectImportResponse>('/projects/import/git', body);
    return data;
};

export const getProjectFiles = async (
    projectId: number,
): Promise<ProjectFileSummaryResponse[]> => {
    const { data } = await axiosInstance.get<ProjectFileSummaryResponse[]>(
        `/projects/${projectId}/files`,
    );
    return data;
};

export const getProjectFileContent = async (
    projectId: number,
    path: string,
): Promise<ProjectFileContentResponse> => {
    const { data } = await axiosInstance.get<ProjectFileContentResponse>(
        `/projects/${projectId}/files/content`,
        { params: { path } },
    );
    return data;
};
