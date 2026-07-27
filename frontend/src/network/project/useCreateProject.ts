import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from './project';
import { queryKeys } from '../core/queryKeys';

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProject,
        onSuccess: (_, { session }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.project.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.project.bySession(session) });
        },
    });
};