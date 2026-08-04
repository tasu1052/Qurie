import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  Badge,
  Button,
  EmptyState,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useDownloadUserReportPdf,
  useGetClass,
  useGetUserReport,
  useMe,
  type UserReportDetailResponse,
} from '../../data';

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(0)}%`;
}

function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(1);
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return `${Math.round(ms / 1000)}초`;
  return `${minutes}분`;
}

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

function UserReportBody({
  report,
  className,
}: {
  report: UserReportDetailResponse;
  className: string;
}) {
  const navigate = useNavigate();
  const downloadPdf = useDownloadUserReportPdf();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const issued = report.issuedAt
    ? new Date(report.issuedAt).toLocaleString('ko-KR', { hour12: false })
    : '—';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/app/report')}>
            리포트 목록
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>종합 리포트</h1>
            <Badge status="accent">학기</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {report.userName} · {className}
          </span>
        </div>
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
                onError: () => setPdfError('PDF 내보내기에 실패했습니다. 리포트가 발급됐는지 확인해 주세요.'),
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
          {report.sessionCount}개 세션 리포트를 모아 정답률 {formatPct(report.accuracy)}, 완료율{' '}
          {formatPct(report.completionRate)}로 정리했어요.
        </p>
        <span style={{ fontSize: 12.5, color: 'var(--text-inverse)' }}>발급 {issued}</span>
      </div>

      <StatCardRow>
        <StatCard
          label="세션 참여"
          value={String(report.sessionCount)}
          caption="집계된 세션 리포트"
        />
        <StatCard
          label="종합 정답률"
          value={formatPct(report.accuracy)}
          caption={`${report.quizCorrectCount} / ${report.quizTotalCount} 정답`}
          accent
        />
        <StatCard
          label="퀴즈 완료율"
          value={formatPct(report.completionRate)}
          caption={`${report.quizAttemptedCount} 응시 · ${report.quizSkippedCount} 스킵`}
        />
        <StatCard
          label="누적 평점"
          value={formatRating(report.rating)}
          caption={`평균 소요 ${formatDuration(report.avgElapsedMs)}`}
        />
      </StatCardRow>
    </>
  );
}

function UserReportLoaded({ classId, className }: { classId: number; className: string }) {
  const { data: me } = useMe();
  const { data: report } = useGetUserReport(me.id, classId);
  return <UserReportBody report={report} className={className} />;
}

function UserReportWithClass({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  return <UserReportLoaded classId={classId} className={cls.name} />;
}

function UserReportGate() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  if (me.classId == null || me.classId <= 0) {
    return (
      <EmptyState
        message="반 배정이 필요합니다"
        description="클래스에 배정되면 학기 종합 리포트를 열 수 있어요."
        actionLabel="리포트 목록"
        onAction={() => navigate('/app/report')}
      />
    );
  }
  return <UserReportWithClass classId={me.classId} />;
}

export default function UserReportSummaryPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="report" breadcrumbs={['리포트', '종합 리포트']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<ReportSkeleton />}
          errorFallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <RowErrorFallback
                onRetry={() => setRowKey((k) => k + 1)}
                title="종합 리포트를 불러오지 못했습니다"
                description="아직 발급되지 않았거나 권한이 없을 수 있어요."
              />
              <Link to="/app/report" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                리포트 목록으로
              </Link>
            </div>
          }
        >
          <UserReportGate />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
