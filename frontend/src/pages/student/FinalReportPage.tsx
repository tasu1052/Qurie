import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  Badge,
  Button,
  ChartLegend,
  EmptyState,
  LineChart,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useDownloadUserReportPdf,
  useGetClass,
  useGetUserReport,
  useGetUserSessionReports,
  useMe,
  type SessionReportSummaryResponse,
  type UserReportDetailResponse,
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
      <Skeleton width="100%" height={160} radius={16} delay={0.06} />
    </div>
  );
}

const MOCK_AI_COMMENT =
  '전반적으로 개념 이해도는 안정적이에요. 오답이 반복되는 유형(의존성 배열, 경계 조건)만 집중 복습하면 다음 세션 정답률이 빠르게 올라갈 거예요.';
const MOCK_INSTRUCTOR_COMMENT =
  '세션 참여 태도가 좋습니다. 틀린 문항 해설에서 핵심 문장만 노트에 남기는 습관을 추천해요.';

type BarItem = { label: string; display: string; pct: number };

function SimpleBars({ items }: { items: BarItem[] }) {
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
        gap: 14,
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
        학습 지표
      </span>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.display}</span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: 'var(--surface-sunken)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, item.pct))}%`,
                height: '100%',
                borderRadius: 999,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentBlock({
  title,
  badge,
  body,
}: {
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{title}</span>
        <Badge status="neutral">{badge}</Badge>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{body}</p>
    </div>
  );
}

function SemesterSummaryHero({
  report,
  className,
}: {
  report: UserReportDetailResponse;
  className: string;
}) {
  const downloadPdf = useDownloadUserReportPdf();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const issued = report.issuedAt
    ? new Date(report.issuedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '—';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} strokeWidth={1.75} />}
          disabled={downloadPdf.isPending}
          onClick={() => {
            setPdfError(null);
            downloadPdf.mutate(
              { userId: report.ordinaryUserId, classId: report.classId },
              {
                onError: () =>
                  setPdfError('PDF 내보내기에 실패했습니다. 리포트가 발급됐는지 확인해 주세요.'),
              },
            );
          }}
        >
          {downloadPdf.isPending ? '내보내는 중…' : 'PDF로 내보내기'}
        </Button>
      </div>
      {pdfError ? (
        <span style={{ fontSize: 13, color: 'var(--status-error)' }}>{pdfError}</span>
      ) : null}
      <div
        style={{
          background: 'var(--ink)',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            background: 'var(--accent)',
            color: 'var(--text-inverse)',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          SEMESTER SUMMARY
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-inverse)', margin: 0 }}>
          학기 전체 학습 요약
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--grey-300)', maxWidth: 720 }}>
          {report.userName} · {className} · {report.sessionCount}개 세션 리포트 집계
        </p>
        <span style={{ fontSize: 12.5, color: 'var(--text-inverse)' }}>발급 {issued}</span>
      </div>
    </>
  );
}

function SemesterSummarySection({ userId, classId, className }: { userId: number; classId: number; className: string }) {
  const { data: report } = useGetUserReport(userId, classId);
  return <SemesterSummaryHero report={report} className={className} />;
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

  const barItems = useMemo((): BarItem[] => {
    const accuracies = reports
      .map((r) => (r.accuracy != null ? Number(r.accuracy) : null))
      .filter((v): v is number => v != null);
    const completions = reports
      .map((r) => (r.completionRate != null ? Number(r.completionRate) : null))
      .filter((v): v is number => v != null);
    const ratings = reports
      .map((r) => (r.quizRating != null ? Number(r.quizRating) : null))
      .filter((v): v is number => v != null);

    const accuracy = avg(accuracies);
    const completion = avg(completions);
    const rating = avg(ratings);

    return [
      {
        label: '종합 정답률',
        display: formatPct(accuracy),
        pct: accuracy ?? 0,
      },
      {
        label: '퀴즈 완료율',
        display: formatPct(completion),
        pct: completion ?? 0,
      },
      {
        label: '세션 참여',
        display: `${reports.length}회`,
        pct: reports.length > 0 ? Math.min(100, reports.length * 12) : 0,
      },
      {
        label: '누적 평점',
        display: formatRating(rating),
        pct: rating != null ? (rating / 5) * 100 : 0,
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
        <QueryAsyncBoundary
          suspenseFallback={<Skeleton width="100%" height={120} radius={16} />}
          errorFallback={null}
        >
          <SemesterSummarySection userId={me.id} classId={classId} className={className} />
        </QueryAsyncBoundary>
      ) : null}

      <SimpleBars items={barItems} />

      <div className="qurie-app-split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <CommentBlock title="AI 학습 코멘트" badge="데모 · mock" body={MOCK_AI_COMMENT} />
        <CommentBlock title="강사 코멘트" badge="데모 · mock" body={MOCK_INSTRUCTOR_COMMENT} />
      </div>

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
