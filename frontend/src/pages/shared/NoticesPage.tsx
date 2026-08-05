import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPage } from '../../components/layout/AppPage';
import { MasterNoticesBody } from '../../components/notices/MasterNoticesBody';
import { ManagerNoticesBody } from '../../components/notices/ManagerNoticesBody';
import { StudentNoticesBody } from '../../components/notices/StudentNoticesBody';
import { ListSkeleton } from '../../components/notices/noticesShared';
import { EmptyState, RowErrorFallback } from '../../ds';
import { QueryAsyncBoundary, useMe } from '../../data';

function MasterNoticesGate() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<ListSkeleton />}
      errorFallback={
        <RowErrorFallback
          onRetry={() => setRowKey((k) => k + 1)}
          title="공지를 불러오지 못했습니다"
          description="목록을 다시 불러와 주세요."
        />
      }
    >
      <MasterNoticesBody />
    </QueryAsyncBoundary>
  );
}

function ManagerNoticesGate() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [rowKey, setRowKey] = useState(0);
  const classId = me.classId;

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 공지를 작성·조회할 수 없습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<ListSkeleton />}
      errorFallback={
        <RowErrorFallback onRetry={() => setRowKey((k) => k + 1)} title="공지를 불러오지 못했습니다" />
      }
    >
      <ManagerNoticesBody classId={classId} />
    </QueryAsyncBoundary>
  );
}

function StudentNoticesGate() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [rowKey, setRowKey] = useState(0);
  const classId = me.classId;

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="소속 클래스가 없습니다"
        description="반 배정 후 공지를 조회할 수 있습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/app')}
      />
    );
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<ListSkeleton />}
      errorFallback={
        <RowErrorFallback onRetry={() => setRowKey((k) => k + 1)} title="공지를 불러오지 못했습니다" />
      }
    >
      <StudentNoticesBody classId={classId} />
    </QueryAsyncBoundary>
  );
}

export default function NoticesPage() {
  const { data: user } = useMe();
  const breadcrumbs =
    user.role === 'MASTER'
      ? ['SSAFY 서울캠퍼스', '공지사항']
      : user.role === 'STUDENT'
        ? ['공지사항']
        : ['담당 클래스', '공지사항'];

  return (
    <AppPage activeKey="announcements" breadcrumbs={breadcrumbs}>
      {user.role === 'MASTER' ? (
        <MasterNoticesGate />
      ) : user.role === 'STUDENT' ? (
        <StudentNoticesGate />
      ) : (
        <ManagerNoticesGate />
      )}
    </AppPage>
  );
}
