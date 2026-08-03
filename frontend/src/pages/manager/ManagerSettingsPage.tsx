import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { AlertBanner, Button, EmptyState, RowErrorFallback, Skeleton } from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useMe,
  useUpdateClass,
  type ClassResponse,
} from '../../data';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function SettingsSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <Skeleton width={140} height={14} />
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={80} />
      <Skeleton width={100} height={36} />
    </div>
  );
}

function ClassSettingsFormFields({ cls }: { cls: ClassResponse }) {
  const updateClass = useUpdateClass();
  const [name, setName] = useState(cls.name);
  const [description, setDescription] = useState(cls.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    name.trim() !== cls.name || (description.trim() || '') !== (cls.description ?? '');

  const onSave = () => {
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError('클래스 이름을 입력하세요.');
      return;
    }
    updateClass.mutate(
      {
        classId: cls.id,
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setError(apiErrorMessage(err, '클래스 저장에 실패했습니다.')),
      },
    );
  };

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
        gap: 16,
        maxWidth: 560,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>클래스 설정</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          담당 클래스의 이름과 기본 정보를 수정합니다.
        </p>
      </div>

      {error ? <AlertBanner tone="error" title="저장 실패" description={error} /> : null}
      {saved && !dirty ? (
        <AlertBanner tone="success" title="저장됨" description="클래스 정보가 업데이트되었습니다." />
      ) : null}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>클래스 이름</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>설명</span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          rows={4}
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={onSave} disabled={!dirty || updateClass.isPending}>
          {updateClass.isPending ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}

function ClassSettingsForm({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  return <ClassSettingsFormFields key={`${cls.id}-${cls.updatedAt}`} cls={cls} />;
}

function ManagerSettingsBody() {
  const navigate = useNavigate();
  const { data: me } = useMe();

  if (me.classId == null) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 클래스 설정을 열 수 없습니다. 마스터에게 클래스 배정을 요청하세요."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return <ClassSettingsForm classId={me.classId} />;
}

export default function ManagerSettingsPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <ManagerShell activeKey="settings" breadcrumbs={['설정']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<SettingsSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="설정을 불러오지 못했습니다"
              description="클래스 정보를 다시 불러와 주세요."
            />
          }
        >
          <ManagerSettingsBody />
        </QueryAsyncBoundary>
      </PageMain>
    </ManagerShell>
  );
}
