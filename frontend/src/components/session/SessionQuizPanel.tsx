import { useMemo, useState } from 'react';
import {
  getProjectFileContent,
  getProjectFiles,
  useGenerateQuiz,
  useMeOptional,
  usePollQuizQuestions,
  usePollQuizSet,
  type QuizGenerationMode,
  type QuizItem,
  type QuizQuestionItem,
} from '../../data';
import { AlertBanner, AsyncJobPanel, Badge, Button, Input, Select } from '../../ds';

type SessionQuizPanelProps = {
  projectId: number | null;
  versionHash: string | null;
  /** 세션 웹소켓(`/topic/sessions/{id}/quiz`)으로 도착한 퀴즈셋 id. 다른 참여자가 만든 것도 여기로 들어온다. */
  pushedQuizSetId?: number | null;
};

function mapJobStatus(
  status: string | undefined,
): 'PENDING' | 'GENERATING' | 'RUNNING' | 'FAILED' | 'DONE' | undefined {
  if (status === 'QUEUED') return 'PENDING';
  if (status === 'GENERATING') return 'GENERATING';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'COMPLETED') return 'DONE';
  return undefined;
}

function ManagerQuizList({ quizzes }: { quizzes: QuizItem[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {quizzes.map((q) => (
        <div
          key={q.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge status="neutral">{q.type}</Badge>
            <Badge status="accent">{q.difficulty}</Badge>
            <Badge status="neutral">{q.purpose}</Badge>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45 }}>
            {q.orderNo}. {q.question}
          </span>
          {q.choices.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {q.choices.map((c) => (
                <li key={c.idx} style={{ marginBottom: 2 }}>
                  {c.content}
                  {c.answer ? (
                    <span style={{ marginLeft: 6, color: 'var(--status-success)', fontWeight: 600 }}>정답</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{q.explanation}</span>
        </div>
      ))}
    </div>
  );
}

function StudentQuizList({ quizzes }: { quizzes: QuizQuestionItem[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {quizzes.map((q) => (
        <div
          key={q.id}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge status="neutral">{q.type}</Badge>
            <Badge status="accent">{q.difficulty}</Badge>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45 }}>
            {q.orderNo}. {q.question}
          </span>
          {q.choices.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {q.choices.map((c) => (
                <li key={c.idx} style={{ marginBottom: 2 }}>
                  {c.content}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SessionQuizPanel({
  projectId,
  versionHash,
  pushedQuizSetId = null,
}: SessionQuizPanelProps) {
  const meQuery = useMeOptional();
  const role = meQuery.isSuccess ? meQuery.data?.role : undefined;
  const isInstructor = role === 'MANAGER' || role === 'MASTER';

  const generateQuiz = useGenerateQuiz();
  const [mode, setMode] = useState<QuizGenerationMode>('PRACTICE');
  const [count, setCount] = useState('5');
  const [userPrompt, setUserPrompt] = useState('');
  const [quizSetId, setQuizSetId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeQuizSetId =
    pushedQuizSetId != null && (quizSetId == null || pushedQuizSetId > quizSetId)
      ? pushedQuizSetId
      : quizSetId;

  const managerPoll = usePollQuizSet(isInstructor ? activeQuizSetId : null);
  const studentPoll = usePollQuizQuestions(!isInstructor ? activeQuizSetId : null);
  const poll = isInstructor ? managerPoll : studentPoll;

  const jobStatus = mapJobStatus(poll.data?.status);
  const canGenerate =
    isInstructor && projectId != null && versionHash != null && !generateQuiz.isPending;

  const summary = useMemo(() => poll.data ?? null, [poll.data]);

  const onGenerate = async () => {
    if (!isInstructor || projectId == null || versionHash == null) return;
    const n = Number(count);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      setFormError('문항 수는 1–20 사이여야 합니다.');
      return;
    }
    setFormError(null);
    try {
      const fileSummaries = await getProjectFiles(projectId);
      const files: Record<string, string> = {};
      await Promise.all(
        fileSummaries.slice(0, 40).map(async (f) => {
          const body = await getProjectFileContent(projectId, f.path);
          files[body.path] = body.content;
        }),
      );
      if (Object.keys(files).length === 0) {
        setFormError('퀴즈 생성에 쓸 파일이 없습니다. 프로젝트를 먼저 임포트하세요.');
        return;
      }
      generateQuiz.mutate(
        {
          projectId,
          mode,
          count: n,
          ratioEasy: 1,
          ratioNormal: 1,
          ratioHard: 1,
          userPrompt: userPrompt.trim() || undefined,
          versionHash,
          files,
        },
        {
          onSuccess: (res) => setQuizSetId(res.quizSetId),
          onError: (err) => {
            setFormError(err instanceof Error ? err.message : '퀴즈 생성 요청에 실패했습니다.');
          },
        },
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '프로젝트 파일을 불러오지 못했습니다.');
    }
  };

  if (activeQuizSetId == null && (projectId == null || versionHash == null)) {
    return (
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          {isInstructor
            ? '프로젝트를 임포트한 뒤 퀴즈를 생성할 수 있습니다.'
            : '강사가 퀴즈를 생성하면 여기에 나타나요.'}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'auto',
        minHeight: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>

      {formError ? (
        <AlertBanner
          tone="error"
          title="요청 실패"
          description={formError}
          actionLabel="닫기"
          onAction={() => setFormError(null)}
        />
      ) : null}

      {isInstructor ? (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>모드</span>
            <Select
              size="sm"
              value={mode}
              onChange={(v) => setMode(v as QuizGenerationMode)}
              options={[
                { value: 'PRACTICE', label: 'PRACTICE' },
                { value: 'ASSESSMENT', label: 'ASSESSMENT' },
              ]}
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>문항 수</span>
            <Input value={count} onChange={(e) => setCount(e.target.value)} width="100%" />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>추가 프롬프트</span>
            <Input
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="강조할 개념 (선택)"
              width="100%"
            />
          </label>

          <Button variant="primary" disabled={!canGenerate} onClick={() => void onGenerate()}>
            {generateQuiz.isPending ? '요청 중…' : '퀴즈 생성'}
          </Button>
        </>
      ) : null}

      {activeQuizSetId != null ? (
        <AsyncJobPanel
          label="AI 퀴즈"
          status={jobStatus}
          title={
            summary?.status === 'COMPLETED'
              ? `퀴즈셋 #${activeQuizSetId} 생성 완료`
              : summary?.status === 'FAILED'
                ? `퀴즈셋 #${activeQuizSetId} 실패`
                : `퀴즈셋 #${activeQuizSetId} 생성 중`
          }
          description={
            summary
              ? isInstructor && 'generatedCount' in summary
                ? `요청 ${summary.requestedCount} · 생성 ${summary.generatedCount}`
                : `요청 ${summary.requestedCount}문항`
              : '상태를 확인하는 중…'
          }
          done={
            isInstructor && summary && 'generatedCount' in summary ? summary.generatedCount : null
          }
          total={summary?.requestedCount ?? null}
          errorMessage={
            isInstructor && summary && 'errorMessage' in summary
              ? (summary.errorMessage ?? undefined)
              : undefined
          }
          meta={
            isInstructor
              ? `GET /quiz/${activeQuizSetId} · 세션 소켓 알림 수신 시 즉시 갱신`
              : `GET /quiz/${activeQuizSetId}/questions · 정답·해설 제외`
          }
        >
          {summary?.status === 'COMPLETED' && summary.quizzes.length > 0 ? (
            isInstructor ? (
              <ManagerQuizList quizzes={summary.quizzes as QuizItem[]} />
            ) : (
              <StudentQuizList quizzes={summary.quizzes as QuizQuestionItem[]} />
            )
          ) : null}
        </AsyncJobPanel>
      ) : null}
    </div>
  );
}
