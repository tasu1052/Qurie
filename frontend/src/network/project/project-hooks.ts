import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { createProject, type ProjectCreateRequest } from './project-apis';

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ProjectCreateRequest) => createProject(body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.sessionId) });
        },
    });
};
