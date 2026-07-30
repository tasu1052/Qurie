import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { EmptyState, RowErrorFallback, Skeleton } from '../../ds';
import { QueryAsyncBoundary, useGetMyClasses } from '../../data';

function ClassHomeBody() {
  const navigate = useNavigate();
  const { data: classes } = useGetMyClasses();

  useEffect(() => {
    if (classes.length === 1) {
      navigate(`/app/classes/${classes[0].id}`, { replace: true });
    }
  }, [classes, navigate]);

  if (classes.length === 0) {
    return (
      <EmptyState
        message="소속 클래스가 없습니다"
        description="클래스에 배정되면 여기에서 로비로 이동할 수 있습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/app')}
      />
    );
  }

  if (classes.length === 1) {
    return <Skeleton width="100%" height={120} radius={16} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>내 클래스</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          입장할 클래스를 선택하세요.
        </span>
      </div>
      <div className="qurie-card-grid">
        {classes.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/app/classes/${c.id}`)}
            style={{
              textAlign: 'left',
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 24,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              #{c.classNumber}
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {c.description || '클래스 로비로 이동'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** `/app/classes` — redirects when one class, lists when many, empty when none. */
export default function ClassHomePage() {
  return (
    <StudentShell activeKey="class" breadcrumbs={['클래스']}>
      <PageMain>
        <QueryAsyncBoundary
          suspenseFallback={<Skeleton width="100%" height={160} radius={16} />}
          errorFallback={
            <RowErrorFallback title="클래스 목록을 불러오지 못했습니다" description="다시 시도해 주세요." />
          }
        >
          <ClassHomeBody />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
