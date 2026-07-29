import { axiosInstance } from '../core/axiosInstance';

export interface GroupCreateRequest {
    classId: number;
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
}

export interface GroupUpdateRequest {
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
}

export interface GroupResponse {
    id: number;
    classId: number;
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
    createdAt: string;
    updatedAt: string;
}

export const createGroup = async (body: GroupCreateRequest): Promise<GroupResponse> => {
    const { data } = await axiosInstance.post<GroupResponse>('/groups', body);
    return data;
};

export const getGroups = async (classId: number): Promise<GroupResponse[]> => {
    const { data } = await axiosInstance.get<GroupResponse[]>('/groups', {
        params: { classId },
    });
    return data;
};

export const getGroup = async (groupId: number): Promise<GroupResponse> => {
    const { data } = await axiosInstance.get<GroupResponse>(`/groups/${groupId}`);
    return data;
};

export const updateGroup = async (
    groupId: number,
    body: GroupUpdateRequest,
): Promise<GroupResponse> => {
    const { data } = await axiosInstance.put<GroupResponse>(`/groups/${groupId}`, body);
    return data;
};

export const deleteGroup = async (groupId: number): Promise<void> => {
    await axiosInstance.delete(`/groups/${groupId}`);
};
