import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  Badge,
  Button,
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
import {
  getPastSessionsMock,
  resolvePastSessionMock,
  type PastSessionMock,
} from '../../mocks/pastLearning';

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

type SessionReportRow = {
  key: string;
  sessionId: number;
  title: string;
  accuracy: number | null;
  quizRating: number | null;
  issuedAt: string | null;
  aiSummary: string;
  quizSetId: number;
  demoOnly: boolean;
  scoreLabel?: string;
};

function toRowsFromReports(reports: SessionReportSummaryResponse[]): SessionReportRow[] {
  return reports.map((s) => {
    const mock = resolvePastSessionMock(s.sessionId);
    return {
      key: `report-${s.sessionReportId}`,
      sessionId: s.sessionId,
      title: s.sessionTitle,
      accuracy: s.accuracy,
      quizRating: s.quizRating,
      issuedAt: s.issuedAt,
      aiSummary: mock.aiSummary,
      quizSetId: mock.quizSetId,
      demoOnly: false,
      scoreLabel: `${mock.scoreCorrect}/${mock.scoreTotal} 정답`,
    };
  });
}

function toRowsFromMocks(mocks: PastSessionMock[]): SessionReportRow[] {
  return mocks.map((s) => ({
    key: `mock-${s.sessionId}`,
    sessionId: s.sessionId,
    title: s.title,
    accuracy: s.scoreTotal > 0 ? (s.scoreCorrect / s.scoreTotal) * 100 : null,
    quizRating: null,
    issuedAt: s.endedAt,
    aiSummary: s.aiSummary,
    quizSetId: s.quizSetId,
    demoOnly: true,
    scoreLabel: `${s.scoreCorrect}/${s.scoreTotal} 정답`,
  }));
}

function SessionReportTable({
  rows,
  onOpen,
  onQuiz,
  onGoDashboard,
}: {
  rows: SessionReportRow[];
  onOpen: (sessionId: number) => void;
  onQuiz: (quizSetId: number) => void;
  onGoDashboard: () => void;
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
      <div
        style={{
          padding: '20px 24px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
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
          세션 리포트
        </span>
        {rows.some((r) => r.demoOnly) ? (
          <Badge status="neutral">데모 · AI 연동 예정</Badge>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '8px 24px 24px' }}>
          <EmptyState
            message="발급된 세션 리포트가 없습니다"
            description="세션이 종료되고 리포트가 발급되면 여기에서 확인할 수 있어요."
            actionLabel="대시보드"
            onAction={onGoDashboard}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((s) => (
            <div
              key={s.key}
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--divider)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(s.issuedAt)}
                    {s.accuracy != null ? ` · 정답률 ${formatPct(s.accuracy)}` : ''}
                    {s.quizRating != null ? ` · 평점 ${formatRating(s.quizRating)}` : ''}
                  </span>
                </div>
                {s.scoreLabel ? <Badge status="accent">{s.scoreLabel}</Badge> : null}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {s.aiSummary}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => onOpen(s.sessionId)}>
                  상세
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onQuiz(s.quizSetId)}>
                  퀴즈 열람
                </Button>
                <button
                  type="button"
                  onClick={() => onOpen(s.sessionId)}
                  aria-label={`${s.title} 리포트 열기`}
                  style={{
                    marginLeft: 'auto',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    padding: 4,
                  }}
                >
                  <ChevronRight size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinalReportBody({ className, classId }: { className: string; classId: number | null }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: reports } = useGetUserSessionReports(me.id);

  const sessionRows = useMemo(() => {
    if (reports.length > 0) return toRowsFromReports(reports);
    // 실데이터가 없을 때만 시연용 목업을 보여 빈 화면을 피한다.
    return toRowsFromMocks(getPastSessionsMock());
  }, [reports]);

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>리포트</h1>
            <Badge status="neutral">STUDENT</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {me.name} · {className}
          </span>
        </div>
      </div>

      {classId != null ? (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>학기 전체 종합 리포트</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              세션 리포트를 합산한 학기 요약을 확인하고 PDF로 내보낼 수 있어요.
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/report/summary')}>
            종합 리포트 열람
          </Button>
        </div>
      ) : null}

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
        rows={sessionRows}
        onOpen={(sessionId) => navigate(`/session/${sessionId}/report`)}
        onQuiz={(quizSetId) => navigate(`/app/quizzes/${quizSetId}`)}
        onGoDashboard={() => navigate('/app')}
      />
    </>
  );
}

function FinalReportWithClass({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  return <FinalReportBody className={cls.name} classId={classId} />;
}

function FinalReportGate() {
  const { data: me } = useMe();
  if (me.classId == null || me.classId <= 0) {
    return <FinalReportBody className="미배정" classId={null} />;
  }
  return <FinalReportWithClass classId={me.classId} />;
}

export default function FinalReportPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="report" breadcrumbs={['리포트']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<ReportSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="리포트를 불러오지 못했습니다"
            />
          }
        >
          <FinalReportGate />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
