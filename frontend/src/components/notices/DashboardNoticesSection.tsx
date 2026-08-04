import { useNavigate } from 'react-router-dom';
import { QueryAsyncBoundary, useGetNotices, type NoticeResponse, type UserRole } from '../../data';
import { noticeListPath, useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';
import { RowErrorFallback, Skeleton } from '../../ds';

function scopeLabel(scope: NoticeResponse['scope']): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

function NoticesBody({
  role,
  classId,
  size = 5,
}: {
  role: UserRole;
  classId?: number;
  size?: number;
}) {
  const navigate = useNavigate();
  const openNotice = useOpenNoticeDetail();
  const { data } = useGetNotices({
    size,
    classId,
    forAudience: role === 'MANAGER' || role === 'STUDENT' ? true : undefined,
  });
  const notices = data.data;
  const path = noticeListPath(role);

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          공지
        </span>
        {path ? (
          <button
            type="button"
            onClick={() => navigate(path)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: 0,
            }}
          >
            더보기
          </button>
        ) : null}
      </div>
      {notices.length === 0 ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>등록된 공지가 없습니다.</span>
      ) : (
        notices.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => openNotice(n.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              border: 'none',
              borderBottom: '1px solid var(--divider)',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              color: 'inherit',
              padding: '0 0 10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {scopeLabel(n.scope)}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(n.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{n.title}</span>
          </button>
        ))
      )}
    </div>
  );
}

type DashboardNoticesSectionProps = {
  role: UserRole;
  classId?: number;
  size?: number;
};

/** Dashboard strip of recent notices (`GET /notices`). */
export function DashboardNoticesSection({ role, classId, size }: DashboardNoticesSectionProps) {
  return (
    <QueryAsyncBoundary
      suspenseFallback={<Skeleton width="100%" height={180} radius={16} />}
      errorFallback={
        <RowErrorFallback title="공지를 불러오지 못했습니다" description="이 영역만 실패했습니다." />
      }
    >
      <NoticesBody role={role} classId={classId} size={size} />
    </QueryAsyncBoundary>
  );
}
