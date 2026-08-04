import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeOptional, type UserRole } from '../data';

/** 역할별 공지 상세 경로. */
export function noticeDetailPath(role: UserRole, noticeId: number): string {
  if (role === 'MASTER') return `/master/announcements/${noticeId}`;
  if (role === 'MANAGER') return `/manager/announcements/${noticeId}`;
  return `/app/announcements/${noticeId}`;
}

/** 역할별 공지 목록 경로. 학생은 목록 페이지가 없어 null. */
export function noticeListPath(role: UserRole): string | null {
  if (role === 'MASTER') return '/master/announcements';
  if (role === 'MANAGER') return '/manager/announcements';
  return null;
}

/**
 * 공지 클릭 시 상세 열람으로 이동.
 * 목록·대시보드·알림 벨에서 공통으로 쓴다.
 */
export function useOpenNoticeDetail() {
  const navigate = useNavigate();
  const meQuery = useMeOptional();

  return useCallback(
    (noticeId: number) => {
      const role = meQuery.data?.role;
      if (!role) return;
      navigate(noticeDetailPath(role, noticeId));
    },
    [meQuery.data?.role, navigate],
  );
}
