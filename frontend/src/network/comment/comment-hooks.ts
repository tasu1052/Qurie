import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
  createStudentComment,
  getStudentComments,
  type StudentCommentCreateRequest,
} from './comment-apis';

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
    }: StudentCommentCreateRequest & { userId: number }) => createStudentComment(userId, body),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byUser(vars.userId, vars.classId),
      });
    },
  });
};
