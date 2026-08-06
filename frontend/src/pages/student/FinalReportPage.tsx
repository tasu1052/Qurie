import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Download, TriangleAlert } from 'lucide-react';
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
  useGetStudentComments,
  useGetUserReport,
  useGetUserSessionReports,
  useMe,
  type SessionReportSummaryResponse,
  type UserReportDetailResponse,
} from '../../data';
function InstructorCommentsSection({ userId, classId }: { userId: number; classId: number }) {
  const comments = useGetStudentComments(userId, classId).data ?? [];

  if (comments.length === 0) return null;

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
        gap: 12,
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
        강사 코멘트
      </span>
      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface-sunken)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{c.authorName}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(c.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{c.content}</p>
        </div>
      ))}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={80} radius={16} />
      <Skeleton width="100%" height={160} radius={16} delay={0.06} />
    </div>
  );
}

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
          background: 'var(--hero-surface)',
          color: 'var(--hero-fg)',
          border: '1px solid var(--hero-border)',
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
            color: '#ffffff',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          SEMESTER SUMMARY
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--hero-fg)', margin: 0 }}>
          학기 전체 학습 요약
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--hero-fg-muted)', maxWidth: 720 }}>
          {report.userName} · {className} · {report.sessionCount}개 세션 리포트 집계
        </p>
        <span style={{ fontSize: 12.5, color: 'var(--hero-fg-muted)' }}>발급 {issued}</span>
      </div>
    </>
  );
}

/** 세션 리포트 화면의 AI 블록과 같은 구성 — 총평 문단 + 강점/개선점 2열. 값이 없으면 아예 그리지 않는다. */
function AiFeedbackSection({ report }: { report: UserReportDetailResponse }) {
  const strengths = report.aiStrengths ?? [];
  const improvements = report.aiImprovements ?? [];
  const hasBlock =
    Boolean(report.aiComment?.trim()) || strengths.length > 0 || improvements.length > 0;

  if (!hasBlock) return null;

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
        AI 리포트
      </span>
      {report.aiComment?.trim() ? (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 600 }}>
          {report.aiComment}
        </p>
      ) : null}
      {strengths.length > 0 || improvements.length > 0 ? (
        <div className="qurie-app-split" style={{ alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>강점</span>
            {strengths.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
            ) : (
              strengths.map((s) => (
                <div key={s} style={{ display: 'flex', gap: 8 }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>개선점</span>
            {improvements.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
            ) : (
              improvements.map((s) => (
                <div key={s} style={{ display: 'flex', gap: 8 }}>
                  <TriangleAlert size={14} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SemesterSummarySection({ userId, classId, className }: { userId: number; classId: number; className: string }) {
  const { data: report } = useGetUserReport(userId, classId);
  return (
    <>
      <SemesterSummaryHero report={report} className={className} />
      <AiFeedbackSection report={report} />
    </>
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
};

function toRowsFromReports(reports: SessionReportSummaryResponse[]): SessionReportRow[] {
  return reports.map((s) => ({
    key: `report-${s.sessionReportId}`,
    sessionId: s.sessionId,
    title: s.sessionTitle,
    accuracy: s.accuracy,
    quizRating: s.quizRating,
    issuedAt: s.issuedAt,
  }));
}

function SessionReportTable({
  rows,
  onOpen,
  onGoDashboard,
}: {
  rows: SessionReportRow[];
  onOpen: (sessionId: number) => void;
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
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => onOpen(s.sessionId)}>
                  상세
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

  const sessionRows = useMemo(() => toRowsFromReports(reports), [reports]);

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

      {classId != null ? (
        <QueryAsyncBoundary
          suspenseFallback={<Skeleton width="100%" height={120} radius={16} />}
          errorFallback={null}
        >
          <InstructorCommentsSection userId={me.id} classId={classId} />
        </QueryAsyncBoundary>
      ) : null}

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
