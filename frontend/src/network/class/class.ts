import { axiosInstance } from '../core/axiosInstance';
import type { ListParams, PageResponse, UserRole } from '../core/types';

export interface ClassCreateRequest {
    trackId: number;
    name: string;
    classNumber: number;
    capacity: number;
}

export interface ClassUpdateRequest {
    name?: string;
    classNumber?: number;
    capacity?: number;
    status?: string;
}

export interface ClassResponse {
    id: number;
    trackId: number;
    name: string;
    classNumber: number;
    capacity: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassMemberResponse {
    userId: number;
    name: string;
    email: string;
    role: UserRole;
}

export const getClasses = async (
  params: ListParams & { trackId?: number; tech?: string; status?: string },
): Promise<PageResponse<ClassResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ClassResponse>>('/classes', { params });
    return data;
};

export const getClass = async (id: number): Promise<ClassResponse> => {
    const { data } = await axiosInstance.get<ClassResponse>(`/classes/${id}`);
    return data;
};

export const createClass = async (body: ClassCreateRequest): Promise<ClassResponse> => {
    const { data } = await axiosInstance.post<ClassResponse>('/classes', body);
    return data;
};

export const updateClass = async (id: number, body: ClassUpdateRequest): Promise<ClassResponse> => {
    const { data } = await axiosInstance.patch<ClassResponse>(`/classes/${id}`, body);
    return data;
};

export const deleteClass = async (id: number, cascade?: boolean): Promise<void> => {
    await axiosInstance.delete(`/classes/${id}`, { params: { cascade } });
};

export const getClassMembers = async (
  classId: number,
  params: ListParams & { role?: UserRole; flag?: string },
): Promise<PageResponse<ClassMemberResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<ClassMemberResponse>>(
        `/classes/${classId}/members`,
        { params },
    );
    return data;
};

export const assignClassMember = async (
  classId: number,
  body: { userId: number; role: UserRole },
): Promise<ClassMemberResponse> => {
    const { data } = await axiosInstance.post<ClassMemberResponse>(`/classes/${classId}/members`, body);
    return data;
};

export const updateClassMember = async (
  classId: number,
  userId: number,
  body: { role: UserRole },
): Promise<ClassMemberResponse> => {
    const { data } = await axiosInstance.patch<ClassMemberResponse>(
        `/classes/${classId}/members/${userId}`,
        body,
    );
    return data;
};

export const removeClassMember = async (classId: number, userId: number): Promise<void> => {
    await axiosInstance.delete(`/classes/${classId}/members/${userId}`);
};