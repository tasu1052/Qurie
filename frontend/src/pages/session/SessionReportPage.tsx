import { AppShell } from '../../components/layout/AppShell';
import { PageMain } from '../../components/layout/PageMain';
import {
  AlertBanner,
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
  humanizeApiError,
  useCreateSessionReportsForAll,
  useDownloadSessionReportPdf,
  useGetClassMembers,
  useGetQuizProgressSuspense,
  useGetQuizQuestions,
  useGetSession,
  useGetSessionReport,
  useGetSessionReportRoster,
  useMe,
  type QuizProgressItem,
  type QuizQuestionChoiceItem,
  type QuizQuestionItem,
  type SessionReportDetailResponse,
  type SessionReportRosterItemResponse,
} from '../../data';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, RefreshCw, TriangleAlert, XCircle } from 'lucide-react';

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

function ReviewChoiceRow({
  choice,
  correctIdx,
  userChoiceIdx,
  revealed,
}: {
  choice: QuizQuestionChoiceItem;
  correctIdx: number | null;
  userChoiceIdx: number | null;
  revealed: boolean;
}) {
  const isCorrect = correctIdx != null && choice.idx === correctIdx;
  const isUserPick = userChoiceIdx === choice.idx;
  let border = 'var(--border)';
  let background = 'var(--surface-sunken)';
  if (revealed) {
    if (isCorrect) {
      border = 'var(--status-success)';
      background = 'var(--status-success-bg)';
    } else if (isUserPick) {
      border = 'var(--status-error)';
      background = 'var(--status-error-bg)';
    }
  } else if (isUserPick) {
    border = 'var(--accent)';
    background = 'var(--accent-softer)';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${border}`,
        background,
        fontSize: 13,
        color: 'var(--ink)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {revealed && isCorrect ? (
        <CheckCircle2 size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
      ) : revealed && isUserPick && !isCorrect ? (
        <XCircle size={14} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
      ) : (
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '1px solid var(--border-strong)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {choice.idx + 1}
        </span>
      )}
      <span style={{ flex: 1 }}>{choice.content}</span>
      {isUserPick ? (
        <Badge status={revealed && !isCorrect ? 'error' : 'accent'}>내 선택</Badge>
      ) : null}
    </div>
  );
}

function ReviewQuestionCard({
  item,
  progress,
}: {
  item: QuizQuestionItem;
  progress?: QuizProgressItem;
}) {
  const userChoiceIdx = progress?.chosenChoiceIdx ?? null;
  const correctIdx = progress?.correctChoiceIdx ?? null;
  const revealed = progress != null && progress.status === 'ATTEMPTED';
  const skipped = progress?.status === 'SKIPPED' || progress?.status === 'TIMEOUT';
  const isCorrect = progress?.isCorrect;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Q{item.orderNo}</span>
        {isCorrect === true ? <Badge status="success">정답</Badge> : null}
        {isCorrect === false ? <Badge status="error">오답</Badge> : null}
        {skipped ? <Badge status="neutral">건너뜀</Badge> : null}
        {progress == null ? <Badge status="neutral">미응시</Badge> : null}
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)' }}>
        {item.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {item.choices.map((c) => (
          <ReviewChoiceRow
            key={c.idx}
            choice={c}
            correctIdx={correctIdx}
            userChoiceIdx={userChoiceIdx}
            revealed={revealed}
          />
        ))}
      </div>
      {revealed && progress?.explanation?.trim() ? (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
          {progress.explanation}
        </p>
      ) : null}
    </div>
  );
}

function QuizReviewColumn({ quizSetId, userId }: { quizSetId: number; userId: number }) {
  const { data: questions } = useGetQuizQuestions(quizSetId);
  const { data: progressSummary } = useGetQuizProgressSuspense(quizSetId, userId);
  const progressByQuizId = useMemo(() => {
    const map = new Map<number, QuizProgressItem>();
    for (const item of progressSummary.items ?? []) {
      map.set(item.quizId, item);
    }
    return map;
  }, [progressSummary.items]);

  const items = useMemo(
    () => [...questions.quizzes].sort((a, b) => a.orderNo - b.orderNo),
    [questions.quizzes],
  );

  if (items.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>표시할 문항이 없습니다.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        문항 · 내 선택
      </span>
      {items.map((item) => (
        <ReviewQuestionCard key={item.id} item={item} progress={progressByQuizId.get(item.id)} />
      ))}
    </div>
  );
}

function StrengthImprovementColumn({
  strengths,
  improvements,
  managerComment,
}: {
  strengths: string[];
  improvements: string[];
  managerComment: string | null;
}) {
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
        gap: 20,
        minWidth: 0,
        alignSelf: 'start',
        position: 'sticky',
        top: 16,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          강점
        </span>
        {strengths.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>아직 정리된 강점이 없어요.</span>
        ) : (
          strengths.map((s) => (
            <div key={s} style={{ display: 'flex', gap: 8 }}>
              <CheckCircle2 size={15} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
            </div>
          ))
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          개선점
        </span>
        {improvements.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>아직 정리된 개선점이 없어요.</span>
        ) : (
          improvements.map((s) => (
            <div key={s} style={{ display: 'flex', gap: 8 }}>
              <TriangleAlert size={15} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-body)' }}>{s}</span>
            </div>
          ))
        )}
      </div>
      {managerComment?.trim() ? (
        <div
          style={{
            borderTop: '1px solid var(--divider)',
            paddingTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
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
            {managerComment}
          </p>
        </div>
      ) : null}
    </div>
  );
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
  const issued = report.issuedAt
    ? new Date(report.issuedAt).toLocaleString('ko-KR', { hour12: false })
    : '—';
  // 퀴즈를 한 번도 풀지 않은 리포트는 지표·문항을 보여 주지 않고 안내만 한다.
  const hasQuizActivity = report.quizTotalCount > 0 || report.quizAttemptedCount > 0;

  if (!hasQuizActivity) {
    return (
      <>
        <div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(backTo)}>
            목록으로
          </Button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>세션 결과 리포트</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{report.sessionTitle}</span>
            {' — '}
            {report.userName}
          </span>
        </div>
        <EmptyState
          message="세션 참여 이력이 없어요."
          description="세션에서 퀴즈를 풀면 결과 리포트가 표시돼요."
          actionLabel="목록으로"
          onAction={() => navigate(backTo)}
        />
      </>
    );
  }

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

      <div
        className="qurie-app-split"
        style={{
          alignItems: 'start',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.9fr)',
        }}
      >
        {report.quizSetId != null ? (
          <QueryAsyncBoundary
            suspenseFallback={<Skeleton width="100%" height={320} radius={16} />}
            errorFallback={
              <RowErrorFallback title="문항을 불러오지 못했습니다" description="퀴즈 응시 기록을 확인해 주세요." />
            }
          >
            <QuizReviewColumn quizSetId={report.quizSetId} userId={report.ordinaryUserId} />
          </QueryAsyncBoundary>
        ) : (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              이 리포트에 연결된 퀴즈셋이 없어 문항을 표시할 수 없어요.
            </span>
          </div>
        )}
        <StrengthImprovementColumn
          strengths={aiStrengths}
          improvements={aiImprovements}
          managerComment={report.managerComment}
        />
      </div>
    </>
  );
}

/**
 * 강사용 세션 전체 리포트.
 * 발급된 학생 리포트 명단·평균 지표와 일괄 발급/개별 열람을 한 화면에서 처리한다.
 */
function SessionReportOverview({
  sessionId,
  classId,
  backTo,
}: {
  sessionId: number;
  classId: number;
  backTo: string;
}) {
  const navigate = useNavigate();
  const { data: session } = useGetSession(sessionId);
  const { data: roster } = useGetSessionReportRoster(sessionId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const issueAll = useCreateSessionReportsForAll();
  const [issueMsg, setIssueMsg] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  const students = useMemo(
    () => membersPage.data.filter((m) => m.role === 'STUDENT'),
    [membersPage.data],
  );

  const reportByUserId = useMemo(() => {
    const map = new Map<number, SessionReportRosterItemResponse>();
    for (const r of roster.reports) map.set(r.ordinaryUserId, r);
    return map;
  }, [roster.reports]);

  const avgAccuracy = useMemo(() => {
    const values = roster.reports
      .map((r) => (r.accuracy != null ? Number(r.accuracy) : null))
      .filter((v): v is number => v != null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [roster.reports]);

  const avgCompletion = useMemo(() => {
    const values = roster.reports
      .map((r) => (r.completionRate != null ? Number(r.completionRate) : null))
      .filter((v): v is number => v != null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [roster.reports]);

  const pendingCount = Math.max(0, students.length - roster.issuedCount);
  const title = roster.sessionTitle || session.title;

  const onIssueAll = () => {
    setIssueMsg(null);
    setIssueError(null);
    issueAll.mutate(sessionId, {
      onSuccess: (res) => {
        setIssueMsg(`학생 ${res.issuedCount}명의 세션 리포트를 발급했어요.`);
      },
      onError: (err) =>
        setIssueError(humanizeApiError(err, '세션 리포트 일괄 발급에 실패했습니다.')),
    });
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(backTo)}>
            목록으로
          </Button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>세션 전체 리포트</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{title}</span>
            {' — '}
            학생별 세션 리포트를 확인하고 일괄 발급할 수 있어요.
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw size={14} strokeWidth={1.75} />}
          disabled={issueAll.isPending || students.length === 0}
          onClick={onIssueAll}
        >
          {issueAll.isPending ? '발급 중…' : roster.issuedCount > 0 ? '리포트 재발급' : '전원 리포트 발급'}
        </Button>
      </div>

      {issueMsg ? <AlertBanner tone="success" title="발급 완료" description={issueMsg} /> : null}
      {issueError ? <AlertBanner tone="error" title="발급 실패" description={issueError} /> : null}

      <StatCardRow>
        <StatCard label="반 학생" value={String(students.length)} caption="클래스 소속" />
        <StatCard
          label="발급 완료"
          value={String(roster.issuedCount)}
          caption={pendingCount > 0 ? `미발급 ${pendingCount}명` : '전원 발급됨'}
          accent
        />
        <StatCard label="평균 정답률" value={formatPct(avgAccuracy)} caption="발급분 기준" />
        <StatCard label="평균 완료율" value={formatPct(avgCompletion)} caption="발급분 기준" />
      </StatCardRow>

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
          <div
            style={{
              padding: '16px 24px 12px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            학생별 리포트
          </div>
          {students.map((m) => {
            const report = reportByUserId.get(m.userId);
            return (
              <div
                key={m.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '13px 24px',
                  borderTop: '1px solid var(--divider)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                    {report ? (
                      <Badge status="accent">발급됨</Badge>
                    ) : (
                      <Badge status="neutral">미발급</Badge>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {m.email}
                    {report
                      ? ` · 정답률 ${formatPct(report.accuracy)} · 완료율 ${formatPct(report.completionRate)} · 평점 ${formatRating(report.quizRating)}`
                      : ''}
                  </span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!report}
                  onClick={() =>
                    navigate(`/session/${sessionId}/report?userId=${m.userId}&from=roster`)
                  }
                >
                  {report ? '리포트 보기' : '미발급'}
                </Button>
              </div>
            );
          })}
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
  const fromRoster = searchParams.get('from') === 'roster';

  const backTo =
    me.role === 'STUDENT'
      ? '/app/report'
      : fromRoster && Number.isFinite(sessionId)
        ? `/session/${sessionId}/report`
        : me.role === 'MANAGER'
          ? userId != null
            ? `/manager/students/detail/${userId}`
            : '/manager/sessions'
          : '/master';

  const activeKey =
    me.role === 'STUDENT'
      ? 'report'
      : me.role === 'MANAGER'
        ? userId != null && !fromRoster
          ? 'students'
          : 'sessions'
        : 'dashboard';
  const breadcrumbs =
    me.role === 'STUDENT'
      ? ['리포트', '세션 리포트']
      : userId != null
        ? ['세션', '세션 전체 리포트', '학생 리포트']
        : ['세션', '세션 전체 리포트'];

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
            title="세션 전체 리포트를 불러오지 못했습니다"
          />
        }
      >
        <SessionReportOverview sessionId={sessionId} classId={classId} backTo={backTo} />
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
          title={
            me.role === 'STUDENT'
              ? '세션 참여 이력이 없어요.'
              : '세션 리포트를 불러오지 못했습니다'
          }
          description={
            me.role === 'STUDENT'
              ? '세션에서 퀴즈를 풀고 리포트가 발급되면 여기에서 확인할 수 있어요.'
              : '리포트가 아직 발급되지 않았거나 권한이 없을 수 있어요.'
          }
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
