import { axiosInstance } from '../core/axiosInstance';

export type GroupParticipantRole = 'LEADER' | 'PARTICIPANT';

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

export interface GroupMemberResponse {
    userId: number;
    name: string;
    email: string;
    role: GroupParticipantRole;
}

export interface GroupDetailResponse {
    id: number;
    classId: number;
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
    memberCount: number;
    members: GroupMemberResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface GroupMemberCandidateResponse {
    userId: number;
    name: string;
    email: string;
}

export interface GroupEditRequest {
    name?: string;
    description?: string;
    startedAt?: string;
    endedAt?: string;
    memberIds?: number[];
    leaderId?: number;
}

export interface GroupDuplicateRequest {
    name?: string;
    /** true 이면 백엔드 409 — 한 학생은 그룹 하나에만 속할 수 있다. */
    includeMembers?: boolean;
}

export interface GroupShuffleRequest {
    groupCount: number;
    assignLeader?: boolean;
    confirmed?: boolean;
    startedAt?: string;
    endedAt?: string;
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

export const getGroupDetail = async (groupId: number): Promise<GroupDetailResponse> => {
    const { data } = await axiosInstance.get<GroupDetailResponse>(`/groups/${groupId}/detail`);
    return data;
};

/** 내가 속한 그룹(상세). 학생 대시보드용 — 반 전체 회원 API 대신 사용한다. */
export const getMyGroups = async (classId: number): Promise<GroupDetailResponse[]> => {
    const { data } = await axiosInstance.get<GroupDetailResponse[]>('/groups/mine', {
        params: { classId },
    });
    return data;
};

export const getGroupCandidates = async (
    classId: number,
): Promise<GroupMemberCandidateResponse[]> => {
    const { data } = await axiosInstance.get<GroupMemberCandidateResponse[]>('/groups/candidates', {
        params: { classId },
    });
    return data;
};

export const updateGroup = async (
    groupId: number,
    body: GroupUpdateRequest,
): Promise<GroupResponse> => {
    const { data } = await axiosInstance.put<GroupResponse>(`/groups/${groupId}`, body);
    return data;
};

export const editGroup = async (
    groupId: number,
    body: GroupEditRequest,
): Promise<GroupDetailResponse> => {
    const { data } = await axiosInstance.patch<GroupDetailResponse>(`/groups/${groupId}`, body);
    return data;
};

export const duplicateGroup = async (
    groupId: number,
    body?: GroupDuplicateRequest,
): Promise<GroupDetailResponse> => {
    const { data } = await axiosInstance.post<GroupDetailResponse>(
        `/groups/${groupId}/duplicate`,
        body ?? {},
    );
    return data;
};

export const shuffleGroups = async (
    classId: number,
    body: GroupShuffleRequest,
): Promise<GroupDetailResponse[]> => {
    const { data } = await axiosInstance.post<GroupDetailResponse[]>('/groups/shuffle', body, {
        params: { classId },
    });
    return data;
};

export const deleteGroup = async (groupId: number): Promise<void> => {
    await axiosInstance.delete(`/groups/${groupId}`);
};
