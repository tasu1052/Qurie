import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

export interface UserSignUpRequest {
    enterpriseId: number;
    email: string;
    password: string;
    name: string;
    role: UserRole;
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

export const signUp = async (body: UserSignUpRequest): Promise<UserSignUpResponse> => {
    const { data } = await axiosInstance.post<UserSignUpResponse>('/users', body);
    return data;
};

export const getUserProfile = async (userId: number): Promise<UserProfileResponse> => {
    const { data } = await axiosInstance.get<UserProfileResponse>(`/users/${userId}`);
    return data;
};

export const updateUserProfile = async (userId: number, body: UserProfileUpdateRequest): Promise<UserProfileResponse> => {
    const { data } = await axiosInstance.patch<UserProfileResponse>(`/users/${userId}`, body);
    return data;
};