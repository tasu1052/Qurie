import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
}

export interface SignupRequest {
    token: string;
    email: string;
    password: string;
    name: string;
}

export interface MeResponse {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    enterpriseId: number;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
}

export const login = async (body: LoginRequest): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>('/auth/login', body);
    return data;
};

export const signup = async (body: SignupRequest): Promise<MeResponse> => {
    const { data } = await axiosInstance.post<MeResponse>('/auth/signup', body);
    return data;
};

export const refresh = async (): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>('/auth/refresh');
    return data;
};

export const logout = async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
};

export const requestPasswordReset = async (body: PasswordResetRequest): Promise<void> => {
    await axiosInstance.post('/auth/password-reset', body);
};

export const changePassword = async (body: PasswordChangeRequest): Promise<void> => {
    await axiosInstance.patch('/auth/password', body);
};

export const getMe = async (): Promise<MeResponse> => {
    const { data } = await axiosInstance.get<MeResponse>('/auth/me');
    return data;
};