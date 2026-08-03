import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    createStudentComment,
    deleteStudentComment,
    getStudentComments,
    updateStudentComment,
    type StudentCommentCreateRequest,
    type StudentCommentUpdateRequest,
} from './comment-apis';

/** UI 호환: (userId, classId) — Suspense boundary 없이 사용 가능 */
export const useGetStudentComments = (userId: number, classId: number | null) => {
    return useQuery({
        queryKey: queryKeys.comments.byUser(userId, classId),
        queryFn: () => getStudentComments(userId, classId ?? undefined),
        enabled: Number.isFinite(userId) && userId > 0 && classId != null,
    });
};

export const useCreateStudentComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            ...body
        }: StudentCommentCreateRequest & { userId: number }) =>
            createStudentComment(userId, body),
        onSuccess: (_, { userId, classId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.comments.byUser(userId) });
            queryClient.invalidateQueries({
                queryKey: queryKeys.comments.byUser(userId, classId),
            });
        },
    });
};

export const useUpdateStudentComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            commentId,
            userId,
            ...body
        }: StudentCommentUpdateRequest & { commentId: number; userId: number }) =>
            updateStudentComment(commentId, body),
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.comments.byUser(userId) });
        },
    });
};

export const useDeleteStudentComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId }: { commentId: number; userId: number }) =>
            deleteStudentComment(commentId),
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.comments.byUser(userId) });
        },
    });
};
