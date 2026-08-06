import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Download } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  AlertBanner,
  Badge,
  Button,
  ChartLegend,
  EmptyState,
  LineChart,
  Modal,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  humanizeApiError,
  useCreateStudentComment,
  useCreateUserReport,
  useDeleteStudentComment,
  useDownloadUserReportPdf,
  useGetClass,
  useGetClassMembers,
  useGetStudentComments,
  useGetUserProfile,
  useGetUserReport,
  useGetUserSessionReports,
  useMe,
  useUpdateStudentComment,
  type SessionReportSummaryResponse,
  type StudentCommentResponse,
  type UserReportDetailResponse,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { regionLabel } from '../../utils/userProfileExtras';

function genderLabel(gender?: string | null): string {
  if (gender === 'MALE') return '남';
  if (gender === 'FEMALE') return '여';
  return '—';
}

function OverviewSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={90} radius={16} />
      <Skeleton width="100%" height={120} radius={16} delay={0.06} />
      <Skeleton width="100%" height={180} radius={16} delay={0.1} />
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

function StudentHeader({
  userId,
  classId,
  canManage,
  onCreateReport,
  reportPending,
}: {
  userId: number;
  classId: number;
  canManage: boolean;
  onCreateReport: () => void;
  reportPending: boolean;
}) {
  const navigate = useNavigate();
  const { data: profile } = useGetUserProfile(userId);
  const { data: cls } = useGetClass(classId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const member = useMemo(
    () => membersPage.data.find((m) => m.userId === userId) ?? null,
    [membersPage.data, userId],
  );

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--tertiary-100)',
          color: 'var(--quaternary-400)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {profile.name.trim().slice(0, 1) || '?'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{profile.name}</h1>
          {member?.groupName ? <Badge status="accent">{member.groupName}</Badge> : null}
        </div>
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {profile.email} · {cls.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} strokeWidth={1.75} />}
          onClick={() => navigate('/manager/students')}
        >
          목록으로
        </Button>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={onCreateReport} disabled={reportPending}>
            {reportPending ? '생성 중…' : '리포트 생성'}
          </Button>
        ) : null}
      </div>
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
        minHeight: 168,
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
        {report.userName}의 전체 리포트
      </h2>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--hero-fg-muted)', maxWidth: 720 }}>
        {className} · {report.sessionCount}개 세션 리포트 집계
      </p>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--hero-fg-muted)' }}>최근 갱신일 {issued}</span>
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
        <span style={{ fontSize: 13, color: 'var(--status-error)', alignSelf: 'flex-end' }}>
          {pdfError}
        </span>
      ) : null}
    </div>
  );
}

function SemesterSummarySection({
  userId,
  classId,
  className,
}: {
  userId: number;
  classId: number;
  className: string;
}) {
  const { data: report } = useGetUserReport(userId, classId);
  return <SemesterSummaryHero report={report} className={className} />;
}

function MissingReportCta({
  canManage,
  onCreate,
  pending,
}: {
  canManage: boolean;
  onCreate: () => void;
  pending: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 28,
      }}
    >
      <EmptyState
        message="학습 리포트가 아직 없습니다"
        description="세션 리포트를 집계한 학기 학습 리포트를 발급할 수 있어요."
        actionLabel={canManage ? (pending ? '생성 중…' : '리포트 생성') : undefined}
        onAction={canManage && !pending ? onCreate : undefined}
      />
    </div>
  );
}

function StudentInfoPanel({ userId, classId }: { userId: number; classId: number }) {
  const { data: profile } = useGetUserProfile(userId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const member = useMemo(
    () => membersPage.data.find((m) => m.userId === userId) ?? null,
    [membersPage.data, userId],
  );

  const rows = [
    { label: '이메일', value: profile.email },
    { label: '그룹', value: member?.groupName ?? '미배정' },
    { label: '전화번호', value: profile.phone?.trim() || '—' },
    { label: '지역', value: regionLabel(profile.region ?? undefined) },
    { label: '성별', value: genderLabel(profile.gender) },
  ];

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
        gap: 0,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 12,
        }}
      >
        학생 정보
      </span>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '11px 0',
            borderBottom: '1px solid var(--divider)',
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--ink)',
              fontFamily: row.label === '이메일' ? 'var(--font-mono)' : undefined,
              textAlign: 'right',
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CommentCard({
  comment,
  canEdit,
  onSaveEdit,
  onDelete,
  busy,
}: {
  comment: StudentCommentResponse;
  canEdit: boolean;
  onSaveEdit: (content: string) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{comment.authorName}</span>
        <span>{new Date(comment.createdAt).toLocaleString('ko-KR', { hour12: false })}</span>
        {canEdit ? (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            {!editing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setDraft(comment.content);
                    setEditing(true);
                  }}
                >
                  수정
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={onDelete}>
                  삭제
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy || !draft.trim()}
                  onClick={() => {
                    onSaveEdit(draft.trim());
                    setEditing(false);
                  }}
                >
                  저장
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.content);
                  }}
                >
                  취소
                </Button>
              </>
            )}
          </span>
        ) : null}
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            padding: 12,
            minHeight: 72,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      ) : (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {comment.content}
        </p>
      )}
    </div>
  );
}

function InstructorCommentPanel({
  userId,
  classId,
  authorId,
}: {
  userId: number;
  classId: number;
  authorId: number;
}) {
  const commentsQuery = useGetStudentComments(userId, classId);
  const createComment = useCreateStudentComment();
  const updateComment = useUpdateStudentComment();
  const deleteComment = useDeleteStudentComment();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const busy =
    createComment.isPending || updateComment.isPending || deleteComment.isPending;

  const onSave = () => {
    const content = comment.trim();
    if (!content) return;
    setError(null);
    setOk(null);
    createComment.mutate(
      { userId, classId, content },
      {
        onSuccess: () => {
          setComment('');
          setOk('코멘트를 저장했어요.');
        },
        onError: (err) => setError(humanizeApiError(err, '코멘트 저장에 실패했습니다.')),
      },
    );
  };

  const comments = commentsQuery.data ?? [];

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
        매니저 코멘트
      </span>
      {error ? <AlertBanner tone="error" title="저장 실패" description={error} /> : null}
      {ok ? <AlertBanner tone="success" title="저장됨" description={ok} /> : null}
      {commentsQuery.isPending ? <Skeleton width="100%" height={64} radius={12} /> : null}
      {!commentsQuery.isPending && comments.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>아직 코멘트가 없어요.</p>
      ) : null}
      {comments.map((c) => (
        <CommentCard
          key={c.id}
          comment={c}
          canEdit={c.authorId === authorId}
          busy={busy}
          onSaveEdit={(content) => {
            setError(null);
            setOk(null);
            updateComment.mutate(
              { commentId: c.id, userId, content },
              {
                onSuccess: () => setOk('코멘트를 수정했어요.'),
                onError: (err) =>
                  setError(humanizeApiError(err, '코멘트 수정에 실패했습니다.')),
              },
            );
          }}
          onDelete={() => {
            setError(null);
            setOk(null);
            deleteComment.mutate(
              { commentId: c.id, userId },
              {
                onSuccess: () => setOk('코멘트를 삭제했어요.'),
                onError: (err) =>
                  setError(humanizeApiError(err, '코멘트 삭제에 실패했습니다.')),
              },
            );
          }}
        />
      ))}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="코멘트를 입력하세요"
        style={{
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          padding: 12,
          minHeight: 80,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="primary"
          size="sm"
          disabled={!comment.trim() || createComment.isPending}
          onClick={onSave}
        >
          {createComment.isPending ? '저장 중…' : '코멘트 저장'}
        </Button>
      </div>
    </div>
  );
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
}: {
  rows: SessionReportRow[];
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
          세션 목록
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '4px 24px 20px' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>참여한 세션 기록이 없습니다.</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(s.issuedAt)}
                  {s.accuracy != null ? ` · 정답률 ${formatPct(s.accuracy)}` : ''}
                  {s.quizRating != null ? ` · 평점 ${formatRating(s.quizRating)}` : ''}
                </span>
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

function MetricsAndChart({ userId }: { userId: number }) {
  const { data: reports } = useGetUserSessionReports(userId);

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
    <div
      className="qurie-app-split"
      style={{ alignItems: 'stretch', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
    >
      <SimpleBars items={barItems} />
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
      ) : (
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
            justifyContent: 'center',
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
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            세션 리포트가 발급되면 추이가 표시돼요.
          </span>
        </div>
      )}
    </div>
  );
}

function SessionReportsSection({ userId }: { userId: number }) {
  const navigate = useNavigate();
  const { data: reports } = useGetUserSessionReports(userId);
  const sessionRows = useMemo(() => toRowsFromReports(reports), [reports]);

  return (
    <SessionReportTable
      rows={sessionRows}
      onOpen={(sessionId) => navigate(`/session/${sessionId}/report?userId=${userId}`)}
    />
  );
}

function StudentOverviewBody({
  userId,
  classId,
  canManage,
}: {
  userId: number;
  classId: number;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: cls } = useGetClass(classId);
  const createReport = useCreateUserReport();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportKey, setReportKey] = useState(0);

  const onCreateReport = () => {
    setReportError(null);
    setReportMsg(null);
    createReport.mutate(
      { userId, classId },
      {
        onSuccess: (res) => {
          setReportOpen(false);
          setReportMsg(`리포트 #${res.userReportId}을(를) 생성했어요.`);
          void queryClient.invalidateQueries({
            queryKey: queryKeys.users.reportSummary(userId, classId),
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.users.sessionReports(userId),
          });
          setReportKey((k) => k + 1);
        },
        onError: (err) =>
          setReportError(humanizeApiError(err, '리포트 생성에 실패했습니다.')),
      },
    );
  };

  return (
    <>
      <StudentHeader
        userId={userId}
        classId={classId}
        canManage={canManage}
        onCreateReport={() => setReportOpen(true)}
        reportPending={createReport.isPending}
      />
      {reportMsg ? <AlertBanner tone="success" title="리포트 생성" description={reportMsg} /> : null}
      {reportError ? <AlertBanner tone="error" title="리포트 실패" description={reportError} /> : null}

      <QueryAsyncBoundary
        key={`report-${reportKey}`}
        suspenseFallback={<Skeleton width="100%" height={140} radius={16} />}
        errorFallback={
          <MissingReportCta
            canManage={canManage}
            pending={createReport.isPending}
            onCreate={() => setReportOpen(true)}
          />
        }
      >
        <SemesterSummarySection userId={userId} classId={classId} className={cls.name} />
      </QueryAsyncBoundary>

      <QueryAsyncBoundary
        suspenseFallback={<Skeleton width="100%" height={200} radius={16} />}
        errorFallback={
          <RowErrorFallback title="학습 지표를 불러오지 못했습니다" description="세션 리포트 집계를 확인해 주세요." />
        }
      >
        <MetricsAndChart userId={userId} />
      </QueryAsyncBoundary>

      <QueryAsyncBoundary
        suspenseFallback={<Skeleton width="100%" height={160} radius={16} />}
        errorFallback={
          <RowErrorFallback title="세션 목록을 불러오지 못했습니다" />
        }
      >
        <SessionReportsSection userId={userId} />
      </QueryAsyncBoundary>

      {canManage ? (
        <InstructorCommentPanel userId={userId} classId={classId} authorId={me.id} />
      ) : null}

      <QueryAsyncBoundary
        suspenseFallback={<Skeleton width="100%" height={160} radius={16} />}
        errorFallback={<RowErrorFallback title="학생 정보를 불러오지 못했습니다" />}
      >
        <StudentInfoPanel userId={userId} classId={classId} />
      </QueryAsyncBoundary>

      <Modal
        open={reportOpen}
        title="리포트 생성"
        description="선택한 학생의 학습 요약 리포트를 발급합니다. 세션 리포트가 없으면 지표가 비어 있을 수 있어요."
        primaryLabel={createReport.isPending ? '생성 중…' : '생성하기'}
        secondaryLabel="취소"
        onPrimary={onCreateReport}
        onSecondary={() => setReportOpen(false)}
        onClose={() => setReportOpen(false)}
        width={440}
      />
    </>
  );
}

function StudentOverviewGate() {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId = Number(userIdParam);
  const { data: me } = useMe();
  const classId = me.classId;
  const canManage = me.role === 'MANAGER' || me.role === 'MASTER';

  if (!Number.isFinite(userId) || userId <= 0) {
    return (
      <EmptyState
        message="잘못된 학생 경로입니다"
        description="학생 관리 목록에서 다시 선택해 주세요."
        actionLabel="학생 관리"
        onAction={() => navigate('/manager/students')}
      />
    );
  }

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 학생 정보를 불러올 수 없습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return <StudentMembershipGate userId={userId} classId={classId} canManage={canManage} />;
}

function StudentMembershipGate({
  userId,
  classId,
  canManage,
}: {
  userId: number;
  classId: number;
  canManage: boolean;
}) {
  const navigate = useNavigate();
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const member = useMemo(
    () => membersPage.data.find((m) => m.userId === userId && m.role === 'STUDENT') ?? null,
    [membersPage.data, userId],
  );

  if (!member) {
    return (
      <EmptyState
        message="학생을 찾을 수 없습니다"
        description="담당 클래스에 해당 학생이 없거나 목록에서 제외되었습니다."
        actionLabel="학생 관리"
        onAction={() => navigate('/manager/students')}
      />
    );
  }

  return <StudentOverviewBody userId={userId} classId={classId} canManage={canManage} />;
}

export default function StudentOverviewPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <ManagerShell activeKey="students" breadcrumbs={['학생 관리', '학생 상세']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<OverviewSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="학생 정보를 불러오지 못했습니다"
            />
          }
        >
          <StudentOverviewGate />
        </QueryAsyncBoundary>
      </PageMain>
    </ManagerShell>
  );
}

/** 예전 `/manager/students/:id` 북마크 호환 */
export function RedirectLegacyStudentDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/manager/students" replace />;
  return <Navigate to={`/manager/students/detail/${id}`} replace />;
}
