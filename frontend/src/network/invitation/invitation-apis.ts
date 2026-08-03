import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

export interface InvitationCreateRequest {
    email: string;
    classId: number;
    role: UserRole;
}

export interface InvitationCreateResponse {
    id: number;
    email: string;
    role: UserRole;
    classId: number;
    className: string;
    expiresAt: string;
    token: string;
    signUpUrl: string;
}

export interface InvitationPreviewResponse {
    email: string;
    role: UserRole;
    classId: number;
    className: string;
    expiresAt: string;
}

export const createInvitation = async (
    body: InvitationCreateRequest,
): Promise<InvitationCreateResponse> => {
    const { data } = await axiosInstance.post<InvitationCreateResponse>('/invitations', body);
    return data;
};

export const getInvitationPreview = async (token: string): Promise<InvitationPreviewResponse> => {
    const { data } = await axiosInstance.get<InvitationPreviewResponse>(`/invitations/${token}`);
    return data;
};

export interface BulkInvitationRowResult {
    rowNumber: number;
    email: string;
    invited: boolean;
    message: string | null;
}

export interface BulkInvitationResponse {
    total: number;
    invited: number;
    failed: number;
    results: BulkInvitationRowResult[];
}

export interface BulkInvitationParams {
    file: File;
    classId: number;
    role: UserRole;
}

export const createBulkInvitations = async (
    params: BulkInvitationParams,
): Promise<BulkInvitationResponse> => {
    const form = new FormData();
    form.append('file', params.file);
    const { data } = await axiosInstance.post<BulkInvitationResponse>(
        '/invitations/bulk',
        form,
        {
            params: { classId: params.classId, role: params.role },
            headers: { 'Content-Type': 'multipart/form-data' },
        },
    );
    return data;
};
