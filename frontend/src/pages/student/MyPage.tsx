import { useState } from 'react';
import { Camera } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, Button, Skeleton, StatCard, StatCardRow } from '../../ds';
import { useMyPageRow } from '../../data';

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--surface-card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function MyPage() {
  const row = useMyPageRow();
  const [loginAlert, setLoginAlert] = useState(true);

  return (
    <StudentShell activeKey="me" breadcrumbs={['마이페이지']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<ProfileSkeleton />}
          onRetry={row.refetch}
          emptyMessage="프로필을 불러올 수 없습니다"
        >
          {row.data && (
            <>
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-card)',
                  padding: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--tertiary-100)',
                      color: 'var(--quaternary-400)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    박
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      right: -2,
                      bottom: -2,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--ink)',
                      color: 'var(--text-inverse)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={12} strokeWidth={1.75} />
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{row.data.name}</h1>
                    <Badge status="neutral">{row.data.systemRole}</Badge>
                    <Badge status="accent">클래스 {row.data.classRole}</Badge>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {row.data.email} · {row.data.className}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" onClick={() => undefined}>수정</Button>
                  <Button variant="ghost" onClick={() => undefined}>로그아웃</Button>
                </div>
              </div>

              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
              </StatCardRow>

              <div className="qurie-master-split">
                <div
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: 'var(--shadow-card)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>
                    계정 정보
                  </span>
                  {[
                    { label: '이름', value: row.data.name },
                    { label: '이메일', value: row.data.email },
                    { label: '시스템 역할', value: row.data.systemRole },
                    { label: '클래스', value: row.data.className },
                    { label: '클래스 역할', value: row.data.classRole },
                  ].map((rowItem) => (
                    <div
                      key={rowItem.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid var(--divider)',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{rowItem.label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontFamily: rowItem.label === '이메일' ? 'var(--font-mono)' : undefined }}>
                        {rowItem.value}
                      </span>
                    </div>
                  ))}
                </div>

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
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    보안
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>비밀번호</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>마지막 변경 · 90일 전</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => undefined}>변경</Button>
                  </div>
                  <div
                    style={{
                      background: 'var(--status-warning-bg)',
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 12.5,
                      color: 'var(--status-warning)',
                      lineHeight: 1.55,
                    }}
                  >
                    2FA가 아직 설정되지 않았습니다. 계정 보안을 위해 활성화를 권장합니다.
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer' }}>
                    <span>로그인 알림</span>
                    <input type="checkbox" checked={loginAlert} onChange={(e) => setLoginAlert(e.target.checked)} />
                  </label>
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </StudentShell>
  );
}
