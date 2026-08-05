import { AppShell } from '../../components/layout/AppShell';
import { PageMain } from '../../components/layout/PageMain';
import {
  Badge,
  Button,
  ChartLegend,
  DonutChart,
  EmptyState,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  humanizeApiError,
  useCreateSessionReportsForAll,
  useDownloadSessionReportPdf,
  useGetClassMembers,
  useGetSessionReport,
  useMe,
  type SessionReportDetailResponse,
} from '../../data';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, RefreshCw, TriangleAlert } from 'lucide-react';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
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

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return `${Math.round(ms / 1000)}초`;
  return `${minutes}분`;
}

function difficultySegments(ratio: Record<string, unknown> | null) {
  if (!ratio) {
    return [
      { label: 'EASY', value: 0 },
      { label: 'NORMAL', value: 0, accent: true },
      { label: 'HARD', value: 0 },
    ];
  }
  const easy = Number(ratio.EASY ?? ratio.easy ?? 0);
  const normal = Number(ratio.NORMAL ?? ratio.normal ?? 0);
  const hard = Number(ratio.HARD ?? ratio.hard ?? 0);
  return [
    { label: 'EASY', value: easy },
    { label: 'NORMAL', value: normal, accent: true as const },
    { label: 'HARD', value: hard },
  ];
}

function conceptBars(stats: Record<string, unknown> | null) {
  if (!stats) return [];
  return Object.entries(stats)
    .slice(0, 6)
    .map(([label, raw], i) => {
      const value =
        typeof raw === 'number'
          ? raw
          : raw && typeof raw === 'object' && 'accuracy' in (raw as object)
            ? Number((raw as { accuracy: unknown }).accuracy)
            : Number(raw);
      return {
        label,
        value: Number.isFinite(value) ? value : 0,
        highlight: i === 0,
      };
    });
}

function SessionReportBody({
  report,
  sessionId,
  backTo,
  userRole,
}: {
  report: SessionReportDetailResponse;
  sessionId: number;
  backTo: string;
  userRole: string;
}) {
  const navigate = useNavigate();
  const downloadPdf = useDownloadSessionReportPdf();
  const reissueReports = useCreateSessionReportsForAll();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reissueError, setReissueError] = useState<string | null>(null);
  // 실제 리포트의 quizSetId 가 없으면 퀴즈 열람을 제공하지 않는다(목업 id 사용 금지).
  const quizPath =
    report.quizSetId == null
      ? null
      : userRole === 'STUDENT'
        ? `/app/quizzes/${report.quizSetId}`
        : `/manager/quizzes/${report.quizSetId}`;
  const isManager = userRole === 'MANAGER' || userRole === 'MASTER';
  const aiStrengths = report.aiStrengths ?? [];
  const aiImprovements = report.aiImprovements ?? [];
  const hasAiBlock =
    Boolean(report.aiComment?.trim()) || aiStrengths.length > 0 || aiImprovements.length > 0;
  const segments = useMemo(() => difficultySegments(report.difficultyRatio), [report.difficultyRatio]);
  const categories = useMemo(() => conceptBars(report.conceptStats), [report.conceptStats]);
  const hardSeg = segments.find((s) => s.label === 'HARD');
  const issued = report.issuedAt
    ? new Date(report.issuedAt).toLocaleString('ko-KR', { hour12: false })
    : '—';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(backTo)}>
            목록으로
          </Button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>세션 결과 리포트</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{report.sessionTitle}</span>
            {' — '}
            {report.userName} 학생 결과입니다.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {quizPath != null ? (
            <Button variant="secondary" size="sm" onClick={() => navigate(quizPath)}>
              퀴즈 열람
            </Button>
          ) : null}
          {isManager ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} strokeWidth={1.75} />}
              disabled={reissueReports.isPending}
              onClick={() => {
                setReissueError(null);
                // 성공 시 훅이 sessions.detail(sessionId) 를 무효화하고,
                // report 쿼리 키가 그 하위라 이 화면 데이터도 함께 갱신된다.
                reissueReports.mutate(sessionId, {
                  onError: (err) =>
                    setReissueError(humanizeApiError(err, '리포트 재발급에 실패했습니다.')),
                });
              }}
            >
              {reissueReports.isPending ? '재발급 중…' : '리포트 재발급'}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} strokeWidth={1.75} />}
            disabled={downloadPdf.isPending}
            onClick={() => {
              setPdfError(null);
              downloadPdf.mutate(
                { sessionId: report.sessionId, userId: report.ordinaryUserId },
                {
                  onError: () => setPdfError('PDF 내보내기에 실패했습니다.'),
                },
              );
            }}
          >
            {downloadPdf.isPending ? '내보내는 중…' : 'PDF로 내보내기'}
          </Button>
          <Badge status="accent">SESSION</Badge>
        </div>
      </div>

      {pdfError ? (
        <span style={{ fontSize: 13, color: 'var(--status-error)' }}>{pdfError}</span>
      ) : null}
      {reissueError ? (
        <span style={{ fontSize: 13, color: 'var(--status-error)' }}>{reissueError}</span>
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
          SESSION COMPLETED
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-inverse)', margin: 0 }}>
          {report.aiComment?.trim()
            ? '세션 리포트가 발급되었습니다'
            : '퀴즈 결과가 정리되었습니다'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--grey-300)', maxWidth: 720 }}>
          {report.aiComment?.trim() ||
            `${report.userName} 학생의 이번 세션 정답률은 ${formatPct(report.accuracy)}, 완료율은 ${formatPct(report.completionRate)}입니다.`}
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-inverse)' }}>
            평점 {formatRating(report.quizRating)} / 5.0
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-inverse)' }}>발급 {issued}</span>
        </div>
      </div>

      <StatCardRow>
        <StatCard
          label="퀴즈 완료율"
          value={formatPct(report.completionRate)}
          caption={`${report.quizAttemptedCount} / ${report.quizTotalCount} 문항 응시`}
        />
        <StatCard
          label="정답률"
          value={formatPct(report.accuracy)}
          caption={`${report.quizCorrectCount}문항 정답 · ${report.quizSkippedCount} 스킵`}
          accent
        />
        <StatCard label="평점 (rating)" value={formatRating(report.quizRating)} caption="5.0 만점" />
        <StatCard
          label="평균 소요"
          value={formatDuration(report.avgElapsedMs)}
          caption="문항당 평균"
        />
      </StatCardRow>

      {hasAiBlock ? (
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
          {(aiStrengths.length > 0 || aiImprovements.length > 0) ? (
            <div className="qurie-app-split" style={{ alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>강점</span>
                {aiStrengths.length === 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                ) : (
                  aiStrengths.map((s) => (
                    <div key={s} style={{ display: 'flex', gap: 8 }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>개선점</span>
                {aiImprovements.length === 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                ) : (
                  aiImprovements.map((s) => (
                    <div key={s} style={{ display: 'flex', gap: 8 }}>
                      <TriangleAlert size={14} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
          {report.managerComment?.trim() ? (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              강사 코멘트: {report.managerComment}
            </p>
          ) : null}
        </div>
      ) : (
        <ApiIntegrationPanel groupId="sessionReportAi" variant="compact" title="AI 리포트 API" />
      )}

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
            난이도 비율
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <DonutChart
              segments={segments}
              size={140}
              centerValue={hardSeg ? `H ${hardSeg.value}%` : '—'}
              centerLabel="HARD 비중"
            />
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
            카테고리별 정답률
          </span>
          {categories.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              카테고리 집계가 아직 없습니다.
            </span>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map((c) => (
                  <div key={c.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {formatPct(c.value)}
                      </span>
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
                          width: `${Math.min(100, Math.max(0, c.value))}%`,
                          height: '100%',
                          background: c.highlight ? 'var(--accent)' : 'var(--ink)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <ChartLegend items={[{ label: '카테고리', accent: true }]} />
            </>
          )}
        </div>
      </div>

      <div className="qurie-app-split" style={{ alignItems: 'start' }}>
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
            AI 피드백 요약
          </span>
          {(report.aiStrengths?.length ?? 0) === 0 && (report.aiImprovements?.length ?? 0) === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              AI 피드백이 아직 없습니다.
            </span>
          ) : (
            <>
              {(report.aiStrengths ?? []).map((s) => (
                <div key={s} style={{ display: 'flex', gap: 10 }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-body)' }}>{s}</span>
                </div>
              ))}
              {(report.aiImprovements ?? []).map((s) => (
                <div key={s} style={{ display: 'flex', gap: 10 }}>
                  <TriangleAlert size={15} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-body)' }}>{s}</span>
                </div>
              ))}
            </>
          )}
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
            강사 코멘트
          </span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {report.managerComment?.trim() || '등록된 강사 코멘트가 없습니다.'}
          </p>
          <div
            style={{
              borderTop: '1px solid var(--divider)',
              paddingTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)' }}>SR-{report.sessionReportId}</span>
            <span>발급 {issued}</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
        문항별 상세는 quiz_progress API가 준비되면 이 화면에 표시돼요.{' '}
        <Link to={backTo} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          돌아가기
        </Link>
      </div>
    </>
  );
}

/**
 * 강사(매니저·마스터)용 학생 선택 화면.
 * 세션 리포트는 학생 단위로 발급되므로, userId 없이 들어온 강사에게
 * 본인 리포트를 조회(항상 404)하는 대신 어떤 학생의 리포트를 볼지 고르게 한다.
 */
function ManagerStudentPicker({
  sessionId,
  classId,
  backTo,
}: {
  sessionId: number;
  classId: number;
  backTo: string;
}) {
  const navigate = useNavigate();
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const students = membersPage.data.filter((m) => m.role === 'STUDENT');

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(backTo)}>
          목록으로
        </Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>세션 리포트</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          리포트를 확인할 학생을 선택하세요.
        </span>
      </div>
      {students.length === 0 ? (
        <EmptyState message="반에 학생이 없습니다" />
      ) : (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          {students.map((m) => (
            <div
              key={m.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '13px 24px',
                borderBottom: '1px solid var(--divider)',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    wordBreak: 'break-all',
                  }}
                >
                  {m.email}
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/session/${sessionId}/report?userId=${m.userId}`)}
              >
                리포트 보기
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SessionReportLoader({
  sessionId,
  userId,
  backTo,
  userRole,
}: {
  sessionId: number;
  userId?: number;
  backTo: string;
  userRole: string;
}) {
  const { data: report } = useGetSessionReport(sessionId, userId);
  return (
    <SessionReportBody
      report={report}
      sessionId={sessionId}
      backTo={backTo}
      userRole={userRole}
    />
  );
}

export default function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [rowKey, setRowKey] = useState(0);

  const sessionId = Number(id);
  const userIdParam = searchParams.get('userId');
  const userId = userIdParam != null && userIdParam !== '' ? Number(userIdParam) : undefined;

  const backTo =
    me.role === 'STUDENT'
      ? '/app/report'
      : me.role === 'MANAGER'
        ? userId != null
          ? `/manager/students/detail/${userId}`
          : '/manager/sessions'
        : '/master';

  const activeKey =
    me.role === 'STUDENT' ? 'report' : me.role === 'MANAGER' ? (userId != null ? 'students' : 'sessions') : 'dashboard';
  const breadcrumbs =
    me.role === 'STUDENT' ? ['리포트', '세션 리포트'] : ['세션', '세션 리포트'];

  const wrap = (children: ReactNode) => (
    <AppShell role={me.role} activeKey={activeKey} breadcrumbs={breadcrumbs}>
      <PageMain>{children}</PageMain>
    </AppShell>
  );

  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    return wrap(
      <EmptyState
        message="잘못된 세션입니다"
        actionLabel="돌아가기"
        onAction={() => navigate(backTo)}
      />,
    );
  }

  // 강사가 userId 없이 접근하면 본인 리포트 조회가 되어 항상 404 가 난다 — 학생 선택 화면을 먼저 보여준다.
  if (me.role !== 'STUDENT' && (userId == null || !Number.isFinite(userId))) {
    const classId = me.classId;
    if (typeof classId !== 'number' || !Number.isFinite(classId) || classId <= 0) {
      return wrap(
        <EmptyState
          message="소속 클래스가 없습니다"
          description="반 배정 후 세션 리포트를 볼 수 있습니다."
          actionLabel="돌아가기"
          onAction={() => navigate(backTo)}
        />,
      );
    }
    return wrap(
      <QueryAsyncBoundary
        key={`picker-${rowKey}-${sessionId}`}
        suspenseFallback={<ReportSkeleton />}
        errorFallback={
          <RowErrorFallback
            onRetry={() => setRowKey((k) => k + 1)}
            title="학생 목록을 불러오지 못했습니다"
          />
        }
      >
        <ManagerStudentPicker sessionId={sessionId} classId={classId} backTo={backTo} />
      </QueryAsyncBoundary>,
    );
  }

  return wrap(
    <QueryAsyncBoundary
      key={`${rowKey}-${sessionId}-${userId ?? 'me'}`}
      suspenseFallback={<ReportSkeleton />}
      errorFallback={
        <RowErrorFallback
          onRetry={() => setRowKey((k) => k + 1)}
          title="세션 리포트를 불러오지 못했습니다"
          description="리포트가 아직 발급되지 않았거나 권한이 없을 수 있어요."
        />
      }
    >
      <SessionReportLoader
        sessionId={sessionId}
        userId={userId != null && Number.isFinite(userId) ? userId : undefined}
        backTo={backTo}
        userRole={me.role}
      />
    </QueryAsyncBoundary>,
  );
}
