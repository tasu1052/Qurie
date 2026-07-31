import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createProject,
    getProjectFileContent,
    getProjectFiles,
    importProjectGit,
    importProjectLocal,
    type ProjectCreateRequest,
    type ProjectImportGitRequest,
    type ProjectImportLocalRequest,
} from './project-apis';

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectCreateRequest) => createProject(body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) });
        },
    });
};

export const useImportProjectLocal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectImportLocalRequest) => importProjectLocal(body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) });
        },
    });
};

export const useImportProjectGit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectImportGitRequest) => importProjectGit(body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) });
        },
    });
};

export const useGetProjectFiles = (projectId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.projects.files(projectId),
        queryFn: () => getProjectFiles(projectId),
    });
};

export const useGetProjectFileContent = (projectId: number, path: string) => {
    return useSuspenseQuery({
        queryKey: queryKeys.projects.fileContent(projectId, path),
        queryFn: () => getProjectFileContent(projectId, path),
    });
};
