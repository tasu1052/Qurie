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