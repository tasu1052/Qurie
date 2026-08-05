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
    versionHash: string | null;
    fileCount: number;
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

/** 세션의 현재 프로젝트(가장 최근 임포트). 없으면 null */
export const getSessionProject = async (sessionId: number): Promise<ProjectResponse | null> => {
    const { data, status } = await axiosInstance.get<ProjectResponse | ''>('/projects/current', {
        params: { sessionId },
        validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
    });
    if (status === 404 || data == null || data === '') return null;
    return data as ProjectResponse;
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

/**
 * 세션 편집기(Yjs 공유 문서)의 편집본을 스냅샷 DB에 저장한다.
 * 갱신된 versionHash 를 담은 프로젝트를 돌려주므로, 이후 퀴즈 생성이 편집된 코드를 기준으로 한다.
 */
export const updateProjectFileContent = async (
    projectId: number,
    path: string,
    content: string,
): Promise<ProjectResponse> => {
    const { data } = await axiosInstance.put<ProjectResponse>(
        `/projects/${projectId}/files/content`,
        { path, content },
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
