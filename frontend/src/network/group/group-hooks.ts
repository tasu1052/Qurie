import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createGroup,
    deleteGroup,
    getGroup,
    getGroups,
    updateGroup,
    type GroupCreateRequest,
    type GroupUpdateRequest,
} from './group-apis';

export const useGetGroups = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.groups.list(classId),
        queryFn: () => getGroups(classId),
    });
};

export const useGetGroup = (groupId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.groups.detail(groupId),
        queryFn: () => getGroup(groupId),
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: GroupCreateRequest) => createGroup(body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(data.classId) });
        },
    });
};

export const useUpdateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, ...body }: GroupUpdateRequest & { groupId: number }) =>
            updateGroup(groupId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(data.classId) });
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId }: { groupId: number; classId: number }) => deleteGroup(groupId),
        onSuccess: (_, { groupId, classId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(classId) });
        },
    });
};
