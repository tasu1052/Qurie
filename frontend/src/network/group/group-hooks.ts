import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createGroup,
    deleteGroup,
    duplicateGroup,
    editGroup,
    getGroup,
    getGroupCandidates,
    getGroupDetail,
    getGroups,
    shuffleGroups,
    updateGroup,
    type GroupCreateRequest,
    type GroupDuplicateRequest,
    type GroupEditRequest,
    type GroupShuffleRequest,
    type GroupUpdateRequest,
} from './group-apis';

const invalidateGroupClass = (
    queryClient: ReturnType<typeof useQueryClient>,
    classId: number,
    groupId?: number,
) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(classId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.candidates(classId) });
    if (groupId !== undefined) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.detailFull(groupId) });
    }
};

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

export const useGetGroupDetail = (groupId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.groups.detailFull(groupId),
        queryFn: () => getGroupDetail(groupId),
    });
};

export const useGetGroupCandidates = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.groups.candidates(classId),
        queryFn: () => getGroupCandidates(classId),
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: GroupCreateRequest) => createGroup(body),
        onSuccess: (data) => {
            invalidateGroupClass(queryClient, data.classId);
        },
    });
};

export const useUpdateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, ...body }: GroupUpdateRequest & { groupId: number }) =>
            updateGroup(groupId, body),
        onSuccess: (data) => {
            invalidateGroupClass(queryClient, data.classId, data.id);
        },
    });
};

export const useEditGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, ...body }: GroupEditRequest & { groupId: number }) =>
            editGroup(groupId, body),
        onSuccess: (data) => {
            invalidateGroupClass(queryClient, data.classId, data.id);
        },
    });
};

export const useDuplicateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            ...body
        }: GroupDuplicateRequest & { groupId: number; classId: number }) =>
            duplicateGroup(groupId, body),
        onSuccess: (data) => {
            invalidateGroupClass(queryClient, data.classId, data.id);
        },
    });
};

export const useShuffleGroups = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            classId,
            ...body
        }: GroupShuffleRequest & { classId: number }) => shuffleGroups(classId, body),
        onSuccess: (_, { classId }) => {
            invalidateGroupClass(queryClient, classId);
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId }: { groupId: number; classId: number }) => deleteGroup(groupId),
        onSuccess: (_, { groupId, classId }) => {
            invalidateGroupClass(queryClient, classId, groupId);
        },
    });
};
