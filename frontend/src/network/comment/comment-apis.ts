import { axiosInstance } from '../core/axiosInstance';
import type { StudentCommentListParams } from '../core/queryKeys/comment.keys';

export type { StudentCommentListParams };

export interface StudentCommentCreateRequest {
    classId: number;
    content: string;
}

export interface StudentCommentUpdateRequest {
    content: string;
}

export interface StudentCommentResponse {
    id: number;
    ordinaryUserId: number;
    classId: number;
    authorId: number;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export const createStudentComment = async (
    userId: number,
    body: StudentCommentCreateRequest,
): Promise<StudentCommentResponse> => {
    const { data } = await axiosInstance.post<StudentCommentResponse>(
        `/users/${userId}/comments`,
        body,
    );
    return data;
};

export const getStudentComments = async (
    userId: number,
    classIdOrParams?: number | StudentCommentListParams,
): Promise<StudentCommentResponse[]> => {
    const params: StudentCommentListParams | undefined =
        typeof classIdOrParams === 'number' ? { classId: classIdOrParams } : classIdOrParams;
    const { data } = await axiosInstance.get<StudentCommentResponse[]>(
        `/users/${userId}/comments`,
        { params },
    );
    return data;
};

export const updateStudentComment = async (
    commentId: number,
    body: StudentCommentUpdateRequest,
): Promise<StudentCommentResponse> => {
    const { data } = await axiosInstance.patch<StudentCommentResponse>(
        `/comments/${commentId}`,
        body,
    );
    return data;
};

export const deleteStudentComment = async (commentId: number): Promise<void> => {
    await axiosInstance.delete(`/comments/${commentId}`);
};
