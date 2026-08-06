import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Skeleton } from '../../ds';
import {
  useGetQuizProgressRoster,
  type QuizProgressRosterItem,
  type QuizRosterStudentStatus,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import type { QuizProgressEvent } from '../../realtime/useSessionSocket';
import { ConfettiBurst } from './ConfettiBurst';

function statusLabel(status: QuizRosterStudentStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return '풀이 중';
    case 'COMPLETED':
      return '완료';
    default:
      return '미시작';
  }
}

function statusBadge(status: QuizRosterStudentStatus) {
  if (status === 'COMPLETED') return <Badge status="accent">완료</Badge>;
  if (status === 'IN_PROGRESS') return <Badge status="warning">풀이 중</Badge>;
  return <Badge status="neutral">미시작</Badge>;
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 72,
        background: 'var(--surface-sunken)',
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--ink)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StudentRow({ student }: { student: QuizProgressRosterItem }) {
  const pct =
    student.totalQuizCount > 0
      ? Math.round((student.answeredCount / student.totalQuizCount) * 100)
      : 0;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 0',
        borderTop: '1px solid var(--divider)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', minWidth: 0 }}>
          {student.userName}
        </span>
        {statusBadge(student.status)}
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'var(--surface-sunken)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: student.status === 'COMPLETED' ? 'var(--status-success)' : 'var(--accent)',
            borderRadius: 999,
            transition: 'width 220ms ease-out',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>
          {student.answeredCount}/{student.totalQuizCount}문항 · {statusLabel(student.status)}
        </span>
        <span>
          정답 {student.correctCount}
        </span>
      </div>
    </div>
  );
}

type InstructorQuizMonitorProps = {
  quizSetId: number;
  liveProgress?: QuizProgressEvent | null;
};

/**
 * 강사용 퀴즈 응시 현황판.
 * REST roster 를 주기적으로 읽고, 웹소켓 quiz-progress 가 오면 즉시 재조회한다.
 */
export function InstructorQuizMonitor({ quizSetId, liveProgress }: InstructorQuizMonitorProps) {
  const queryClient = useQueryClient();
  const rosterQuery = useGetQuizProgressRoster(quizSetId, true);
  const roster = rosterQuery.data;

  useEffect(() => {
    if (liveProgress == null || liveProgress.quizSetId !== quizSetId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.quiz.progressRoster(quizSetId) });
  }, [liveProgress, quizSetId, queryClient]);

  const started =
    liveProgress?.quizSetId === quizSetId && liveProgress.startedStudentCount != null
      ? liveProgress.startedStudentCount
      : (roster?.startedStudentCount ?? 0);
  const inProgress =
    liveProgress?.quizSetId === quizSetId && liveProgress.inProgressStudentCount != null
      ? liveProgress.inProgressStudentCount
      : (roster?.inProgressStudentCount ?? 0);
  const completed =
    liveProgress?.quizSetId === quizSetId
      ? liveProgress.completedStudentCount
      : (roster?.completedStudentCount ?? 0);
  const total =
    liveProgress?.quizSetId === quizSetId
      ? liveProgress.totalStudentCount
      : (roster?.totalStudentCount ?? 0);
  const allCompleted =
    liveProgress?.quizSetId === quizSetId ? liveProgress.allCompleted : (roster?.allCompleted ?? false);

  return (
    <div
      style={{
        position: 'relative',
        marginTop: 4,
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 280,
        background: allCompleted ? 'var(--status-success-bg)' : 'var(--surface-card)',
        overflow: 'hidden',
      }}
    >
      {allCompleted ? <ConfettiBurst /> : null}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>학생 응시 현황</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          강사는 퀴즈를 풀지 않습니다. 학생이 풀이·제출하면 여기에 실시간으로 반영됩니다.
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatChip label="전체" value={total} />
        <StatChip label="시작" value={started} />
        <StatChip label="풀이 중" value={inProgress} accent />
        <StatChip label="완료" value={completed} accent={allCompleted} />
      </div>

      {allCompleted ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 10,
            background: 'var(--surface-card)',
            border: '1px solid var(--status-success)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 14, color: 'var(--status-success)', fontWeight: 700 }}>
            리포트 생성 준비가 완료되었어요
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            모든 학생이 퀴즈를 마쳤어요. 상단에서 리포트를 생성해 주세요.
          </span>
        </div>
      ) : null}

      {rosterQuery.isPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width="100%" height={48} radius={10} />
          <Skeleton width="100%" height={48} radius={10} delay={0.06} />
          <Skeleton width="100%" height={48} radius={10} delay={0.1} />
        </div>
      ) : null}

      {rosterQuery.isError ? (
        <span style={{ fontSize: 12.5, color: 'var(--status-error)' }}>
          응시 현황을 불러오지 못했어요. 잠시 후 다시 시도됩니다.
        </span>
      ) : null}

      {roster && roster.students.length === 0 ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          세션에 배정된 학생이 없어요.
        </span>
      ) : null}

      {roster && roster.students.length > 0 ? (
        <div style={{ overflowY: 'auto', minHeight: 0, maxHeight: 320 }}>
          {roster.students.map((s) => (
            <StudentRow key={s.userId} student={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
