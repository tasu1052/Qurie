import { axiosInstance } from '../axiosInstance';

export type UserRole = 'manager' | 'member';

export interface SignupRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

export interface SignupResponse {
    id: number;
    email: string;
    name: string;
    role: UserRole;
}

export const signup = async (body: SignupRequest): Promise<SignupResponse> => {
    const { data } = await axiosInstance.post<SignupResponse>('/auth/signup', body);
    return data;
}