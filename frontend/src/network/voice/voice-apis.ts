import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

/** REST + STOMP 공유 타입. join/leave/state/signal 은 WebSocket — realtime 레이어에서 사용. */

export interface VoiceParticipantResponse {
    userId: number;
    name: string;
    role: UserRole;
    micMuted: boolean;
    deafened: boolean;
}

export type VoiceChannelEventType = 'JOINED' | 'LEFT' | 'STATE_CHANGED';

export interface VoiceChannelEventResponse {
    type: VoiceChannelEventType;
    sessionId: number;
    participant: VoiceParticipantResponse;
    participants: VoiceParticipantResponse[];
    occurredAt: string;
}

export interface VoiceStateUpdateRequest {
    micMuted: boolean;
    deafened: boolean;
}

export type VoiceSignalType = 'offer' | 'answer' | 'candidate';

export interface VoiceSignalRequest {
    targetUserId: number;
    type: VoiceSignalType;
    /** SDP 또는 ICE candidate JSON 문자열 */
    payload: string;
}

export interface VoiceSignalResponse {
    fromUserId: number;
    type: VoiceSignalType;
    payload: string;
    occurredAt: string;
}

export interface VoiceErrorResponse {
    message: string;
    occurredAt: string;
}

/** 현재 음성 채널 참여자 목록 (세션 첫 렌더·STOMP 이벤트 전 초기 상태). */
export const getVoiceParticipants = async (
    sessionId: number,
): Promise<VoiceParticipantResponse[]> => {
    const { data } = await axiosInstance.get<VoiceParticipantResponse[]>(
        `/sessions/${sessionId}/voice/participants`,
    );
    return data;
};
