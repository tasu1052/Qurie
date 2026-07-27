import { Download, ShieldAlert } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  Chevron,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  useMasterKpiRow,
  useMasterReportsRow,
  useMasterTracksRow,
} from '../../mocks/adapters';
import type { ManagerActivity, ReportRow, TrackCard } from '../../mocks/fixtures';
import javaTech from '../../ds/assets/tech/java_50.png';
import pythonTech from '../../ds/assets/tech/python_50.png';
import dbTech from '../../ds/assets/tech/database_50.png';

const techImg: Record<string, string> = { java: javaTech, python: pythonTech, database: dbTech };

const avatarBg: Record<string, string> = {
  accent: 'var(--accent-soft)',
  muted: 'var(--tertiary-100)',
  warning: 'var(--status-warning-bg)',
};
const avatarFg: Record<string, string> = {
  accent: 'var(--accent)',
  muted: 'var(--quaternary-400)',
  warning: 'var(--status-warning)',
};

function KpiSkeleton() {
  return (
    <StatCardRow>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--stat-card-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Skeleton width={36} height={36} radius={10} delay={i * 0.08} />
          <Skeleton width="60%" height={14} delay={i * 0.08 + 0.04} />
          <Skeleton width="40%" height={12} delay={i * 0.08 + 0.08} />
        </div>
      ))}
    </StatCardRow>
  );
}

function TracksSkeleton() {
  return (
    <div className="qurie-master-split">
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
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            minWidth: 0,
          }}
        >
          <Skeleton width="100%" height={60} radius={6} />
        </div>
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px 14px' }}>
        <Skeleton width={120} height={12} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: '13px 24px', borderTop: '1px solid var(--divider)' }}>
          <Skeleton width="100%" height={14} delay={i * 0.08} />
        </div>
      ))}
    </div>
  );
}

function TrackCardItem({ track }: { track: TrackCard }) {
  const active = track.status === 'active';
  return (
    <div
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
        <img src={techImg[track.tech]} width={22} height={22} alt={track.tech} style={{ objectFit: 'contain' }} />
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{track.name}</span>
          <Badge status={active ? 'success' : 'neutral'}>{track.statusLabel}</Badge>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{track.meta}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: track.accentMetric ? 'var(--accent)' : 'var(--ink)' }}>
          {track.metricValue}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{track.metricLabel}</span>
      </div>
      <Chevron size={12} color="var(--accent)" />
    </div>
  );
}

function ManagerActivityItem({ m }: { m: ManagerActivity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: avatarBg[m.avatarTone],
          color: avatarFg[m.avatarTone],
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {m.initial}
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {m.name} · {m.track}
        </span>
        <span
          style={{
            fontSize: 12,
            color: m.tone === 'warning' ? 'var(--status-warning)' : 'var(--text-muted)',
          }}
        >
          {m.detail}
        </span>
      </div>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: m.tone === 'warning' ? 'var(--status-warning)' : 'var(--status-success)',
        }}
      />
    </div>
  );
}

function ReportTableRow({ r }: { r: ReportRow }) {
  const quizColor =
    r.quizTone === 'accent' ? 'var(--accent)' : r.quizTone === 'error' ? 'var(--status-error)' : 'var(--ink)';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.4fr 1.2fr 0.8fr 0.8fr 1fr',
        padding: '13px 24px',
        borderBottom: '1px solid var(--divider)',
        fontSize: 13,
        alignItems: 'center',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{r.session}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{r.className}</span>
      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.manager}</span>
      <span style={{ color: quizColor, fontWeight: 700 }}>{r.quizRate}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.rating}</span>
      <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{r.issuedAt}</span>
    </div>
  );
}

export default function MasterDashboardPage() {
  const kpi = useMasterKpiRow();
  const tracks = useMasterTracksRow();
  const reports = useMasterReportsRow();

  return (
    <MasterShell activeKey="dashboard" breadcrumbs={['SSAFY 서울캠퍼스', '대시보드']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>대시보드</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              SSAFY 서울캠퍼스의 학습 운영 현황을 한눈에 확인하세요.
            </span>
          </div>
          <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} onClick={() => undefined}>
            리포트 내보내기
          </Button>
        </div>

        {/* Row 1 — KPI */}
        <MockRowBoundary
          status={kpi.status}
          skeleton={<KpiSkeleton />}
          onRetry={kpi.refetch}
          emptyMessage="KPI 데이터가 없습니다"
        >
          <StatCardRow>
            {(kpi.data ?? []).map((item, i) => (
              <StatCard key={i} {...item} />
            ))}
          </StatCardRow>
        </MockRowBoundary>

        {/* Row 2 — Tracks + Managers */}
        <MockRowBoundary
          status={tracks.status}
          skeleton={<TracksSkeleton />}
          onRetry={tracks.refetch}
          emptyMessage="트랙이 없습니다"
          emptyActionLabel="트랙 생성"
        >
          {tracks.data && (
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
                  gap: 14,
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    트랙 현황
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>카드를 클릭하면 트랙 상세로 이동합니다</span>
                </div>
                {tracks.data.tracks.map((t) => (
                  <TrackCardItem key={t.id} track={t} />
                ))}
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
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      매니저 액티비티
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>회원 관리</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tracks.data.managers.map((m) => (
                      <ManagerActivityItem key={m.id} m={m} />
                    ))}
                  </div>
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
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={16} strokeWidth={1.75} style={{ color: 'var(--status-warning)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>인사 관리 알림</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {tracks.data.hrAlert.body}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => undefined}>
                    대상 계정 확인
                  </Button>
                </div>
              </div>
            </div>
          )}
        </MockRowBoundary>

        {/* Row 3 — Recent reports */}
        <MockRowBoundary
          status={reports.status}
          skeleton={<ReportsSkeleton />}
          onRetry={reports.refetch}
          emptyMessage="발급된 리포트가 없습니다"
        >
          {reports.data && (
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  최근 발급 리포트
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>전체 보기</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.4fr 1.2fr 0.8fr 0.8fr 1fr',
                  padding: '10px 24px',
                  borderBottom: '1px solid var(--divider)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                <span>세션</span>
                <span>클래스</span>
                <span>대상 매니저</span>
                <span>퀴즈 참여도</span>
                <span>평점</span>
                <span style={{ textAlign: 'right' }}>발급일</span>
              </div>
              {reports.data.map((r) => (
                <ReportTableRow key={r.id} r={r} />
              ))}
            </div>
          )}
        </MockRowBoundary>
      </PageMain>
    </MasterShell>
  );
}
