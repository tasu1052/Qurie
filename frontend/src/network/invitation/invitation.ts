import { axiosInstance } from '../core/axiosInstance';
import type { ListParams, PageResponse, UserRole } from '../core/types';

export interface InvitationCreateRequest {
    email: string;
    role: UserRole;
    classId?: number;
}

export interface InvitationResponse {
    id: number;
    email: string;
    role: UserRole;
    classId?: number;
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
    token: string;
    expiresAt: string;
}

export interface InvitationTokenResponse {
    email: string;
    role: UserRole;
    classId?: number;
    valid: boolean;
}

export const getInvitations = async (
  params: ListParams & { status?: string; role?: UserRole; classId?: number },
): Promise<PageResponse<InvitationResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<InvitationResponse>>('/invitations', { params });
    return data;
};

export const createInvitation = async (body: InvitationCreateRequest): Promise<InvitationResponse> => {
    const { data } = await axiosInstance.post<InvitationResponse>('/invitations', body);
    return data;
};

export const getInvitationByToken = async (token: string): Promise<InvitationTokenResponse> => {
    const { data } = await axiosInstance.get<InvitationTokenResponse>(`/invitations/${token}`);
    return data;
};

export const resendInvitation = async (id: number): Promise<InvitationResponse> => {
    const { data } = await axiosInstance.post<InvitationResponse>(`/invitations/${id}/resend`);
    return data;
};

export const cancelInvitation = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/invitations/${id}`);
};