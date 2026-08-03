import { axiosInstance } from '../core/axiosInstance';
import type { UserRole } from '../core/types';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUserResponse {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    enterpriseId: number;
    classId: number | null;
}

export const login = async (body: LoginRequest): Promise<AuthUserResponse> => {
    const { data } = await axiosInstance.post<AuthUserResponse>('/auth/login', body);
    return data;
  };

export const refresh = async (): Promise<AuthUserResponse> => {
    const { data } = await axiosInstance.post<AuthUserResponse>('/auth/refresh');
    return data;
};

export const logout = async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
};

export const getMe = async (): Promise<AuthUserResponse> => {
    const { data } = await axiosInstance.get<AuthUserResponse>('/auth/me');
    return data;
};

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirmRequest {
    token: string;
    newPassword: string;
}

/** 재설정 메일 발송. 이메일 존재 여부와 무관하게 204. */
export const requestPasswordReset = async (body: PasswordResetRequest): Promise<void> => {
    await axiosInstance.post('/auth/password-reset', body);
};

/** 메일 토큰으로 비밀번호 재설정 확정. */
export const confirmPasswordReset = async (body: PasswordResetConfirmRequest): Promise<void> => {
    await axiosInstance.post('/auth/password-reset/confirm', body);
};