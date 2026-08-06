import { axiosInstance } from '../core/axiosInstance';

export type AppNotificationType = 'SESSION_OPENED' | 'REPORT_COMMENT' | string;

export interface AppNotificationItem {
  id: number;
  type: AppNotificationType;
  title: string;
  body: string | null;
  link: string | null;
  unread: boolean;
  createdAt: string;
}

export const listAppNotifications = async (): Promise<AppNotificationItem[]> => {
  const { data } = await axiosInstance.get<AppNotificationItem[]>('/notifications');
  return data ?? [];
};

export const getAppNotificationUnreadCount = async (): Promise<number> => {
  const { data } = await axiosInstance.get<{ count: number }>('/notifications/unread-count');
  return data?.count ?? 0;
};

export const markAllAppNotificationsRead = async (): Promise<void> => {
  await axiosInstance.post('/notifications/read-all');
};
