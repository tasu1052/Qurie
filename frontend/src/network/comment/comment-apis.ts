import { axiosInstance } from '../core/axiosInstance';

export interface StudentCommentCreateRequest {
  classId: number;
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

export const getStudentComments = async (
  userId: number,
  classId?: number,
): Promise<StudentCommentResponse[]> => {
  const { data } = await axiosInstance.get<StudentCommentResponse[]>(`/users/${userId}/comments`, {
    params: classId != null ? { classId } : undefined,
  });
  return data;
};

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
