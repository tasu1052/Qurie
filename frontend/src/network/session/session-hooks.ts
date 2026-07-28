import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
  createSession,
  deleteSession,
  getSession,
  getSessions,
  updateSession,
  type SessionCreateRequest,
  type SessionUpdateRequest,
} from './session-apis';

export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: SessionCreateRequest) => createSession(body),
        onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.classId) });
        },
    });
};

export const useGetSessions = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.list(classId),
        queryFn: () => getSessions(classId),
    });
};

export const useGetSession = (id: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.detail(id),
        queryFn: () => getSession(id),
    });
};

export const useUpdateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...body }: SessionUpdateRequest & { id: number }) =>
        updateSession(id, body),
        onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(data.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(data.classId) });
        },
    });
};

export const useDeleteSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: number; classId: number }) => deleteSession(id),
        onSuccess: (_, { id, classId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list(classId) });
        },
    });
};