import { axiosInstance } from '../core/axiosInstance';

export type InvitationRole = 'manager' | 'member';

export interface CreateInvitationRequest {
    role: InvitationRole;
    email?: string;
}

export interface Invitation {
    id: number;
    role: InvitationRole;
    code: string;
}

export const createInvitation = async (body: CreateInvitationRequest): Promise<Invitation> => {
    const { data } = await axiosInstance.post<Invitation>('/invitation', body);
    return data;
};