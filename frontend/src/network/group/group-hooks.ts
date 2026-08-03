import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
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
    getMyGroups,
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
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.mine(classId) });
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

/** 내가 속한 그룹 — 학생/매니저 모두 호출 가능. 반 전체 회원 API 대체. */
export const useGetMyGroups = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.groups.mine(classId),
        queryFn: () => getMyGroups(classId),
    });
};

/** 편집 화면용 — suspense 없이 로드해 후보 API 실패가 상세 화면 전체를 막지 않게 한다. */
export const useGetGroupCandidatesQuery = (classId: number) => {
    return useQuery({
        queryKey: queryKeys.groups.candidates(classId),
        queryFn: () => getGroupCandidates(classId),
        staleTime: 30_000,
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
