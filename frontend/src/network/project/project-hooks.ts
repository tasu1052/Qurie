import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createProject,
    getProjectFileContent,
    getProjectFiles,
    getSessionProject,
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
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.bySession(data.sessionId) });
        },
    });
};

const invalidateAfterProjectImport = (
    queryClient: QueryClient,
    data: { projectId: number; sessionId: number },
) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.files(data.projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.bySession(data.sessionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) });
};

export const useImportProjectLocal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectImportLocalRequest) => importProjectLocal(body),
        onSuccess: (data) => invalidateAfterProjectImport(queryClient, data),
    });
};

export const useImportProjectGit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectImportGitRequest) => importProjectGit(body),
        onSuccess: (data) => invalidateAfterProjectImport(queryClient, data),
    });
};

/** 세션 최신 프로젝트. 다른 참가자가 임포트한 경우도 폴링·STOMP invalidate 로 맞춘다. */
export const useGetSessionProject = (sessionId: number | null, opts?: { poll?: boolean }) => {
    return useQuery({
        queryKey: sessionId != null ? queryKeys.projects.bySession(sessionId) : ['projects', 'session', 'idle'],
        queryFn: () => getSessionProject(sessionId as number),
        enabled: sessionId != null,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: opts?.poll === false ? false : 3000,
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
