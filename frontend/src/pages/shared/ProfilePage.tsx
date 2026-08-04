import { useState } from 'react';
import { AppPage } from '../../components/layout/AppPage';
import { ProfilePageContent } from '../../components/profile/ProfilePageContent';
import { RowErrorFallback, Skeleton, StatCardRow } from '../../ds';
import { QueryAsyncBoundary } from '../../data';

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--stat-card-padding)',
            }}
          >
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function ProfilePage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <AppPage activeKey="me" breadcrumbs={['마이페이지']}>
      <QueryAsyncBoundary
        key={rowKey}
        suspenseFallback={<ProfileSkeleton />}
        errorFallback={
          <RowErrorFallback
            onRetry={() => setRowKey((k) => k + 1)}
            title="프로필을 불러오지 못했습니다"
            description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
          />
        }
      >
        <ProfilePageContent />
      </QueryAsyncBoundary>
    </AppPage>
  );
}
