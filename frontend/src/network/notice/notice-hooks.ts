import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import type { NoticeListFilters } from '../core/queryKeys/notice.keys';
import {
    createNotice,
    deleteNotice,
    getNotice,
    getNotices,
    updateNotice,
    type NoticeCreateRequest,
    type NoticeUpdateRequest,
} from './notice-apis';

export const useGetNotices = (filters: NoticeListFilters = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.notices.list(filters),
        queryFn: () => getNotices(filters),
    });
};

export const useGetNotice = (noticeId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.notices.detail(noticeId),
        queryFn: () => getNotice(noticeId),
    });
};

export const useCreateNotice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: NoticeCreateRequest) => createNotice(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
        },
    });
};

export const useUpdateNotice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ noticeId, ...body }: NoticeUpdateRequest & { noticeId: number }) =>
            updateNotice(noticeId, body),
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.notices.detail(vars.noticeId) });
        },
    });
};

export const useDeleteNotice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (noticeId: number) => deleteNotice(noticeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
        },
    });
};
