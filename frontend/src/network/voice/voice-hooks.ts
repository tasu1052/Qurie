import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { getVoiceParticipants } from './voice-apis';

export const useGetVoiceParticipants = (sessionId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.voice.participants(sessionId),
        queryFn: () => getVoiceParticipants(sessionId),
    });
};

/**
 * 음성 참여자 초기 로더(non-suspense). STOMP `/voice` 토픽 이벤트 전 화면을 채운다.
 */
export const useGetVoicePresence = (sessionId: number | null) => {
    return useQuery({
        queryKey: queryKeys.voice.participants(sessionId ?? -1),
        queryFn: () => getVoiceParticipants(sessionId as number),
        enabled: sessionId != null,
        staleTime: 30_000,
    });
};
