import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  Badge,
  ChartLegend,
  EmptyState,
  LineChart,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetUserSessionReports,
  useMe,
  type SessionReportSummaryResponse,
} from '../../data';

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={80} radius={16} />
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

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(0)}%`;
}

function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(1);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ko-KR');
}

function avg(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function SessionReportTable({
  reports,
  onOpen,
}: {
  reports: SessionReportSummaryResponse[];
  onOpen: (sessionId: number) => void;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px 14px' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          세션 리포트
        </span>
      </div>
      {reports.length === 0 ? (
        <div style={{ padding: '8px 24px 24px' }}>
          <EmptyState
            message="발급된 세션 리포트가 없습니다"
            description="세션이 종료되고 리포트가 발급되면 여기에서 확인할 수 있어요. 행을 클릭하면 상세를 봐요."
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
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
            <span>정답률</span>
            <span>평점</span>
            <span>일자</span>
            <span />
          </div>
          {reports.map((s) => (
            <button
              key={s.sessionReportId}
              type="button"
              onClick={() => onOpen(s.sessionId)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 40px',
                padding: '13px 24px',
                border: 'none',
                borderBottom: '1px solid var(--divider)',
                background: 'transparent',
                fontSize: 13,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                color: 'inherit',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>
                {s.sessionTitle}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatPct(s.accuracy)}</span>
              <span style={{ fontWeight: 600 }}>{formatRating(s.quizRating)}</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(s.issuedAt)}</span>
              <span style={{ display: 'inline-flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                <ChevronRight size={16} strokeWidth={1.75} />
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function FinalReportBody({ className }: { className: string }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: reports } = useGetUserSessionReports(me.id);

  const kpis = useMemo(() => {
    const accuracies = reports
      .map((r) => (r.accuracy != null ? Number(r.accuracy) : null))
      .filter((v): v is number => v != null);
    const ratings = reports
      .map((r) => (r.quizRating != null ? Number(r.quizRating) : null))
      .filter((v): v is number => v != null);
    const completions = reports
      .map((r) => (r.completionRate != null ? Number(r.completionRate) : null))
      .filter((v): v is number => v != null);

    return [
      {
        label: '종합 정답률',
        value: formatPct(avg(accuracies)),
        caption: '세션 리포트 기준',
        accent: true as const,
      },
      {
        label: '퀴즈 완료율',
        value: formatPct(avg(completions)),
        caption: '세션 리포트 기준',
      },
      {
        label: '세션 참여',
        value: String(reports.length),
        caption: '발급된 리포트',
      },
      {
        label: '누적 평점',
        value: formatRating(avg(ratings)),
        caption: '5.0 만점',
      },
    ];
  }, [reports]);

  const line = useMemo(() => {
    const chronological = [...reports].reverse();
    return {
      labels: chronological.map((_, i) => `S${i + 1}`),
      series: [
        {
          name: '세션 정답률',
          values: chronological.map((r) => (r.accuracy != null ? Number(r.accuracy) : 0)),
          accent: true as const,
        },
      ],
    };
  }, [reports]);

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>종합 리포트</h1>
          <Badge status="neutral">STUDENT</Badge>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {me.name} · {className}
        </span>
      </div>

      <StatCardRow>
        {kpis.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </StatCardRow>

      {reports.length > 0 ? (
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
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            세션 정답률
          </span>
          <LineChart series={line.series} labels={line.labels} height={180} />
          <ChartLegend items={line.series.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
        </div>
      ) : null}

      <SessionReportTable
        reports={reports}
        onOpen={(sessionId) => navigate(`/session/${sessionId}/report`)}
      />
    </>
  );
}

function FinalReportWithClass({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  return <FinalReportBody className={cls.name} />;
}

function FinalReportGate() {
  const { data: me } = useMe();
  if (me.classId == null || me.classId <= 0) {
    return <FinalReportBody className="미배정" />;
  }
  return <FinalReportWithClass classId={me.classId} />;
}

export default function FinalReportPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="report" breadcrumbs={['종합 리포트']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<ReportSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="종합 리포트를 불러오지 못했습니다"
            />
          }
        >
          <FinalReportGate />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
