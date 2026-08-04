import { useNavigate, useParams } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { MasterShell, PageMain as MasterPageMain } from '../../components/layout/MasterShell';
import { ManagerShell, PageMain as ManagerPageMain } from '../../components/layout/ManagerShell';
import { StudentShell, PageMain as StudentPageMain } from '../../components/layout/StudentShell';
import { noticeListPath } from '../../hooks/useOpenNoticeDetail';
import {
  QueryAsyncBoundary,
  useGetNotice,
  useMe,
  type NoticeResponse,
  type NoticeScope,
  type UserRole,
} from '../../data';
import { Badge, Button, RowErrorFallback, Skeleton } from '../../ds';

function scopeLabel(scope: NoticeScope): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <Skeleton width="40%" height={28} radius={8} />
      <Skeleton width="100%" height={200} radius={16} />
    </div>
  );
}

function NoticeDetailContent({
  notice,
  onBack,
  backLabel,
}: {
  notice: NoticeResponse;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </div>

      <article
        style={{
          background: 'var(--surface-card)',
          border: `1px solid ${notice.pinned ? 'var(--accent-soft)' : 'var(--border)'}`,
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge status={notice.pinned ? 'accent' : 'neutral'}>{scopeLabel(notice.scope)}</Badge>
          {notice.pinned ? <Pin size={14} strokeWidth={1.75} color="var(--accent)" /> : null}
          {notice.targetName ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{notice.targetName}</span>
          ) : null}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date(notice.createdAt).toLocaleString('ko-KR', { hour12: false })}
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--ink)', lineHeight: 1.35 }}>
          {notice.title}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {notice.body}
        </p>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>작성: {notice.authorName}</span>
      </article>
    </div>
  );
}

function NoticeDetailBody({
  noticeId,
  onBack,
  backLabel,
}: {
  noticeId: number;
  onBack: () => void;
  backLabel: string;
}) {
  const { data: notice } = useGetNotice(noticeId);
  return <NoticeDetailContent notice={notice} onBack={onBack} backLabel={backLabel} />;
}

function NoticeDetailGate({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  const { noticeId: raw } = useParams<{ noticeId: string }>();
  const noticeId = Number(raw);
  if (!Number.isFinite(noticeId) || noticeId <= 0) {
    return (
      <RowErrorFallback
        title="잘못된 공지입니다"
        description="주소의 공지 ID를 확인해 주세요."
        onRetry={onBack}
      />
    );
  }

  return (
    <QueryAsyncBoundary
      suspenseFallback={<DetailSkeleton />}
      errorFallback={
        <RowErrorFallback
          title="공지를 불러오지 못했습니다"
          description="삭제되었거나 열람 권한이 없을 수 있어요."
          onRetry={onBack}
        />
      }
    >
      <NoticeDetailBody noticeId={noticeId} onBack={onBack} backLabel={backLabel} />
    </QueryAsyncBoundary>
  );
}

function fallbackHome(role: UserRole): string {
  if (role === 'MASTER') return '/master';
  if (role === 'MANAGER') return '/manager';
  return '/app';
}

export default function NoticeDetailPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const role = me.role;
  const listPath = noticeListPath(role);
  const backPath = listPath ?? fallbackHome(role);
  const backLabel = listPath ? '목록으로' : '홈으로';
  const onBack = () => navigate(backPath);

  const body = <NoticeDetailGate onBack={onBack} backLabel={backLabel} />;

  if (role === 'MASTER') {
    return (
      <MasterShell activeKey="announcements" breadcrumbs={['공지사항', '상세']}>
        <MasterPageMain>{body}</MasterPageMain>
      </MasterShell>
    );
  }

  if (role === 'MANAGER') {
    return (
      <ManagerShell activeKey="announcements" breadcrumbs={['공지사항', '상세']}>
        <ManagerPageMain>{body}</ManagerPageMain>
      </ManagerShell>
    );
  }

  return (
    <StudentShell activeKey="dashboard" breadcrumbs={['공지', '상세']}>
      <StudentPageMain>{body}</StudentPageMain>
    </StudentShell>
  );
}
