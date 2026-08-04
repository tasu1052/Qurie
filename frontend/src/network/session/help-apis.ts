import { axiosInstance } from '../core/axiosInstance';

export interface HelpRequestResponse {
  id: number;
  sessionId: number;
  classId: number;
  fromUserId: number;
  fromName: string;
  sessionTitle: string;
  createdAt: string;
}

export const createSessionHelpRequest = async (sessionId: number): Promise<HelpRequestResponse> => {
  const { data } = await axiosInstance.post<HelpRequestResponse>(`/sessions/${sessionId}/help`);
  return data;
};

export const getClassHelpRequests = async (classId: number): Promise<HelpRequestResponse[]> => {
  const { data } = await axiosInstance.get<HelpRequestResponse[]>(`/classes/${classId}/help-requests`);
  return data;
};

export const dismissHelpRequest = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/help-requests/${id}`);
};
