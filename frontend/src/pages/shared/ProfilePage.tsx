import { useState } from 'react';
import { AppPage } from '../../components/layout/AppPage';
import { ProfilePageContent } from '../../components/profile/ProfilePageContent';
import { RowErrorFallback, Skeleton } from '../../ds';
import { QueryAsyncBoundary } from '../../data';

function ProfileSkeleton() {
  return (
    <div className="qurie-profile-page">
      <Skeleton width="100%" height={72} radius={12} />
      <Skeleton width="100%" height={180} radius={12} delay={0.06} />
      <Skeleton width="100%" height={140} radius={12} delay={0.12} />
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
