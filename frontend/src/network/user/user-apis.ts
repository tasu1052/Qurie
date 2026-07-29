import { axiosInstance } from '../core/axiosInstance';
import type { ListParams, PageResponse, UserRole } from '../core/types';

export interface UserSignUpRequest {
    token: string;
    password: string;
    name: string;
}

export interface UserSignUpResponse {
    userId: number;
    enterpriseId: number;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
}

export interface UserProfileResponse {
    userId: number;
    enterpriseId: number;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfileUpdateRequest {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface UserSummaryResponse {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    weeklySessionCount: number;
    lastSessionCreatedAt: string | null;
}

export interface UserListParams extends ListParams {
    role?: UserRole;
    q?: string;
}

export const signUp = async (body: UserSignUpRequest): Promise<UserSignUpResponse> => {
    const { data } = await axiosInstance.post<UserSignUpResponse>('/users', body);
    return data;
};

export const getUsers = async (params?: UserListParams): Promise<PageResponse<UserSummaryResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<UserSummaryResponse>>('/users', { params });
    return data;
};

export const getUserProfile = async (userId: number): Promise<UserProfileResponse> => {
    const { data } = await axiosInstance.get<UserProfileResponse>(`/users/${userId}`);
    return data;
};

export const updateUserProfile = async (
    userId: number,
    body: UserProfileUpdateRequest,
): Promise<UserProfileResponse> => {
    const { data } = await axiosInstance.patch<UserProfileResponse>(`/users/${userId}`, body);
    return data;
};
