import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAppNotificationUnreadCount,
  listAppNotifications,
  markAllAppNotificationsRead,
} from './notification-apis';

const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export const useAppNotifications = (enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: listAppNotifications,
    enabled,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
};

export const useAppNotificationUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: getAppNotificationUnreadCount,
    enabled,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
};

export const useMarkAllAppNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAppNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
