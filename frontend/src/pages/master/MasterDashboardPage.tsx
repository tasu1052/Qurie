import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { DashboardNoticesSection } from '../../components/notices/DashboardNoticesSection';
import { Badge, Chevron, RowErrorFallback, Skeleton } from '../../ds';
import { QueryAsyncBoundary, useGetTracks, useGetUsers } from '../../data';
import type { TrackCard } from '../../data';
import javaTech from '../../ds/assets/tech/java_50.png';
import pythonTech from '../../ds/assets/tech/python_50.png';
import dbTech from '../../ds/assets/tech/database_50.png';
import type { TrackSummaryResponse } from '../../data';

const techImg: Record<string, string> = { java: javaTech, python: pythonTech, database: dbTech };

function normalizeTech(tech: string | null): 'java' | 'python' | 'database' {
  const t = (tech ?? '').toLowerCase();
  if (t.includes('python')) return 'python';
  if (t.includes('data') || t.includes('db')) return 'database';
  return 'java';
}

function toTrackCard(t: TrackSummaryResponse): TrackCard {
  return {
    id: String(t.id),
    name: t.name,
    tech: normalizeTech(t.tech),
    status: 'active',
    statusLabel: '활성',
    meta: `클래스 ${t.classCount}`,
    metricValue: '',
    metricLabel: '',
    accentMetric: false,
  };
}

function TracksSkeleton() {
  return (
    <div className="qurie-app-split">
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          minWidth: 0,
        }}
      >
        <Skeleton width={120} height={12} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height={60} radius={12} delay={i * 0.08} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            minWidth: 0,
          }}
        >
          <Skeleton width={120} height={12} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height={30} radius={6} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackCardItem({ track, onClick }: { track: TrackCard; onClick: () => void }) {
  const active = track.status === 'active';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <span
        className="tech-icon-wrap"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: active ? 'var(--accent-softer)' : 'var(--surface-sunken)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={techImg[track.tech]}
          width={22}
          height={22}
          alt={track.tech}
          className="tech-icon"
          style={{ objectFit: 'contain' }}
        />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {track.name}
          </span>
          <Badge status={active ? 'success' : 'neutral'}>{track.statusLabel}</Badge>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{track.meta}</span>
      </div>
      <Chevron size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
    </div>
  );
}

function TracksAndManagers({ onOpenTrack }: { onOpenTrack: (id: string) => void }) {
  const { data: tracksPage } = useGetTracks({ size: 5, sort: 'classCount,desc' });
  const { data: managersPage } = useGetUsers({ role: 'MANAGER', size: 5 });
  const tracks = tracksPage.data.map(toTrackCard);
  const managers = managersPage.data;

  return (
    <div className="qurie-app-split">
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
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
            트랙 목록
          </span>
        </div>
        {tracks.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>등록된 트랙이 없습니다.</span>
        ) : (
          tracks.map((t) => (
            <TrackCardItem key={t.id} track={t} onClick={() => onOpenTrack(t.id)} />
          ))
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
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
              매니저 목록
            </span>
          </div>
          {managers.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>매니저가 없습니다.</span>
          ) : (
            managers.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {(m.name || '?').slice(0, 1)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  주간 세션 {m.weeklySessionCount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function MasterDashboardPage() {
  const navigate = useNavigate();
  const [tracksKey, setTracksKey] = useState(0);

  return (
    <MasterShell activeKey="dashboard" breadcrumbs={['SSAFY 서울캠퍼스', '대시보드']}>
      <PageMain>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>대시보드</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            SSAFY 서울캠퍼스의 학습 운영 현황을 한눈에 확인하세요.
          </span>
        </div>

        <QueryAsyncBoundary
          key={tracksKey}
          suspenseFallback={<TracksSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setTracksKey((k) => k + 1)}
              title="트랙 목록을 불러오지 못했습니다"
            />
          }
        >
          <TracksAndManagers onOpenTrack={(id) => navigate(`/master/tracks/${id}`)} />
        </QueryAsyncBoundary>

        <DashboardNoticesSection role="MASTER" size={5} />
      </PageMain>
    </MasterShell>
  );
}
