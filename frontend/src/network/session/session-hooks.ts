import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import type { ChatMessageListParams } from '../core/queryKeys/session.keys';
import {
    createSession,
    createSessionReport,
    deleteSession,
    getSession,
    getSessionMessages,
    getSessionParticipants,
    getSessionReport,
    getSessions,
    updateSession,
    type SessionCreateRequest,
    type SessionReportCreateRequest,
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

export const useGetSession = (sessionId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.detail(sessionId),
        queryFn: () => getSession(sessionId),
    });
};

export const useGetSessionParticipants = (sessionId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.participants(sessionId),
        queryFn: () => getSessionParticipants(sessionId),
    });
};

export const useGetSessionMessages = (
    sessionId: number,
    params: ChatMessageListParams = {},
) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.messages(sessionId, params),
        queryFn: () => getSessionMessages(sessionId, params),
    });
};

/**
 * 접속자 명단 로더(non-suspense). 소켓의 첫 participants 이벤트가 오기 전 화면을 채우는 용도다 —
 * 같은 사용자의 두 번째 연결은 ENTER 이벤트가 방송되지 않으므로(firstConnection=false)
 * 이 초기 조회가 없으면 탭을 두 개 열었을 때 명단이 비어 보인다.
 */
export const useGetSessionPresence = (sessionId: number | null) => {
    return useQuery({
        queryKey: queryKeys.sessions.participants(sessionId ?? -1),
        queryFn: () => getSessionParticipants(sessionId as number),
        enabled: sessionId != null,
        staleTime: 30_000,
    });
};

export const useCreateSessionReport = () => {
    return useMutation({
        mutationFn: ({
            sessionId,
            ...body
        }: SessionReportCreateRequest & { sessionId: number }) =>
            createSessionReport(sessionId, body),
    });
};

export const useGetSessionReport = (sessionId: number, userId?: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.sessions.report(sessionId, userId),
        queryFn: () => getSessionReport(sessionId, userId),
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
