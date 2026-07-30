import { axiosInstance } from '../core/axiosInstance';
import type { ClassListFilters, ClassMemberListFilters } from '../core/queryKeys/class.keys';
import type { PageResponse, UserRole } from '../core/types';

export interface ClassCreateRequest {
    trackId: number;
    classNumber: number;
    name: string;
    capacity?: number;
    description?: string;
    startedAt?: string;
    endedAt?: string;
}

export interface ClassUpdateRequest {
    classNumber?: number;
    name?: string;
    capacity?: number;
    description?: string;
    startedAt?: string;
    endedAt?: string;
}

export interface ClassResponse {
    id: number;
    trackId: number;
    classNumber: number;
    name: string;
    capacity: number | null;
    description: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClassMemberResponse {
    userId: number;
    name: string;
    email: string;
    role: UserRole;
    groupId: number | null;
    groupName: string | null;
}

export const getMyClasses = async (): Promise<ClassResponse[]> => {
    const { data } = await axiosInstance.get<ClassResponse[]>('/classes/me');
    return data;
};

export const getClasses = async (
    params?: ClassListFilters,
): Promise<PageResponse<ClassResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ClassResponse>>('/classes', { params });
    return data;
};

export const getClass = async (classId: number): Promise<ClassResponse> => {
    const { data } = await axiosInstance.get<ClassResponse>(`/classes/${classId}`);
    return data;
};

export const getClassMembers = async (
    classId: number,
    params?: ClassMemberListFilters,
): Promise<PageResponse<ClassMemberResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ClassMemberResponse>>(
        `/classes/${classId}/users`,
        { params },
    );
    return data;
};

export const createClass = async (body: ClassCreateRequest): Promise<ClassResponse> => {
    const { data } = await axiosInstance.post<ClassResponse>('/classes', body);
    return data;
};

export const updateClass = async (
    classId: number,
    body: ClassUpdateRequest,
): Promise<ClassResponse> => {
    const { data } = await axiosInstance.patch<ClassResponse>(`/classes/${classId}`, body);
    return data;
};

export const deleteClass = async (classId: number): Promise<void> => {
    await axiosInstance.delete(`/classes/${classId}`);
};
