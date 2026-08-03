import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  formatQuizSource,
  getProjectFileContent,
  getProjectFiles,
  useGenerateQuiz,
  useMeOptional,
  usePollQuizQuestions,
  usePollQuizSet,
  useQuizSetsByProject,
  useSubmitQuizSatisfaction,
  type QuizGenerationMode,
  type QuizItem,
  type QuizQuestionItem,
  type QuizQuestionsResponse,
  type QuizSetDetailResponse,
} from '../../data';
import { refresh } from '../../network/auth/auth-apis';
import {
  loadSessionQuizSetId,
  saveSessionQuizSetId,
} from './sessionProjectStorage';
import { AlertBanner, AsyncJobPanel, Badge, Button, Input, Modal, Select } from '../../ds';

type SessionQuizPanelProps = {
  sessionId: number;
  projectId: number | null;
  versionHash: string | null;
  /** 세션 웹소켓(`/topic/sessions/{id}/quiz`)으로 도착한 퀴즈셋 id. 다른 참여자가 만든 것도 여기로 들어온다. */
  pushedQuizSetId?: number | null;
};

function mapJobStatus(
  status: string | undefined,
): 'PENDING' | 'GENERATING' | 'RUNNING' | 'FAILED' | 'DONE' | undefined {
  if (status === 'QUEUED' || status === 'PENDING') return 'PENDING';
  if (status === 'GENERATING') return 'GENERATING';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'COMPLETED' || status === 'READY') return 'DONE';
  return undefined;
}

function isManagerSummary(
  summary: QuizSetDetailResponse | QuizQuestionsResponse,
): summary is QuizSetDetailResponse {
  return 'generatedCount' in summary;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (error.response?.status === 401) {
      return '로그인이 만료되었습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

/**
 * 백엔드 QuizGenerateRequest.versionHash 는 @NotBlank @Size(max=64).
 * Git 버전 해시는 미구현이므로, 비어 있으면 프로젝트 기준 임의 식별자를 넣는다.
 */
function resolveQuizVersionHash(versionHash: string | null | undefined, projectId: number): string {
  const trimmed = versionHash?.trim() ?? '';
  if (trimmed.length > 0) return trimmed.slice(0, 64);
  const stamp = Date.now().toString(16);
  return `local-${projectId}-${stamp}`.slice(0, 64);
}

function QuizMetaRow({
  difficulty,
  purpose,
  type,
  testedConcept,
  filePath,
  lineStart,
  lineEnd,
}: {
  difficulty: string;
  purpose?: string;
  type: string;
  testedConcept: string;
  filePath: string;
  lineStart: number | null;
  lineEnd: number | null;
}) {
  const source = formatQuizSource(filePath, lineStart, lineEnd);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge status="neutral">{type}</Badge>
        <Badge status="accent">{difficulty}</Badge>
        {purpose ? <Badge status="neutral">{purpose}</Badge> : null}
      </div>
      {testedConcept ? (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          개념 · {testedConcept}
        </span>
      ) : null}
      {source ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {source}
        </span>
      ) : null}
    </div>
  );
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
            gap: 8,
          }}
        >
          <QuizMetaRow
            type={q.type}
            difficulty={q.difficulty}
            purpose={q.purpose}
            testedConcept={q.testedConcept}
            filePath={q.filePath}
            lineStart={q.lineStart}
            lineEnd={q.lineEnd}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45 }}>
            {q.orderNo}. {q.question}
          </span>
          {q.choices.length > 0 ? (
            <ul
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {q.choices.map((c) => (
                <li
                  key={c.idx}
                  style={{
                    fontSize: 12.5,
                    color: c.answer ? 'var(--status-success)' : 'var(--text-secondary)',
                    fontWeight: c.answer ? 600 : 400,
                    lineHeight: 1.45,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: c.answer ? 'var(--status-success-bg)' : 'var(--surface-sunken)',
                  }}
                >
                  {c.idx + 1}. {c.content}
                  {c.answer ? <span style={{ marginLeft: 6 }}>정답</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {q.explanation ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              해설 · {q.explanation}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StudentQuizList({ quizzes }: { quizzes: QuizQuestionItem[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

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
            gap: 8,
          }}
        >
          <QuizMetaRow
            type={q.type}
            difficulty={q.difficulty}
            testedConcept={q.testedConcept}
            filePath={q.filePath}
            lineStart={q.lineStart}
            lineEnd={q.lineEnd}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45 }}>
            {q.orderNo}. {q.question}
          </span>
          {q.choices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {q.choices.map((c) => {
                const selected = answers[q.id] === c.idx;
                return (
                  <button
                    key={c.idx}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.idx }))}
                    style={{
                      textAlign: 'left',
                      fontSize: 12.5,
                      color: 'var(--ink)',
                      lineHeight: 1.45,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: selected ? '1px solid var(--accent-strong)' : '1px solid var(--border)',
                      background: selected ? 'var(--status-accent-bg)' : 'var(--surface-sunken)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {c.idx + 1}. {c.content}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SessionQuizPanel({
  sessionId,
  projectId,
  versionHash,
  pushedQuizSetId = null,
}: SessionQuizPanelProps) {
  const meQuery = useMeOptional();
  const role = meQuery.isSuccess ? meQuery.data?.role : undefined;
  const isInstructor = role === 'MANAGER' || role === 'MASTER';

  const generateQuiz = useGenerateQuiz();
  const submitSatisfaction = useSubmitQuizSatisfaction();
  const [mode, setMode] = useState<QuizGenerationMode>('PRACTICE');
  const [count, setCount] = useState('5');
  const [userPrompt, setUserPrompt] = useState('');
  /** 이번 화면에서 방금 생성한 퀴즈셋. 서버/스토리지 복원값과 합쳐 active id 를 고른다. */
  const [createdQuizSetId, setCreatedQuizSetId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [satisfactionComment, setSatisfactionComment] = useState('');
  /** 모달을 닫거나 제출한 퀴즈셋 — 같은 세트에 대해 다시 띄우지 않는다. */
  const [satisfactionDismissedFor, setSatisfactionDismissedFor] = useState<number | null>(null);

  const projectQuizSets = useQuizSetsByProject(projectId);

  const activeQuizSetId = useMemo(() => {
    const cached = loadSessionQuizSetId(sessionId);
    const fromServer = projectQuizSets.data?.[0]?.quizSetId ?? null;
    const candidates = [cached, fromServer, pushedQuizSetId, createdQuizSetId].filter(
      (id): id is number => typeof id === 'number' && id > 0,
    );
    return candidates.length > 0 ? Math.max(...candidates) : null;
  }, [sessionId, projectQuizSets.data, pushedQuizSetId, createdQuizSetId]);

  useEffect(() => {
    if (activeQuizSetId == null) return;
    saveSessionQuizSetId(sessionId, activeQuizSetId);
  }, [sessionId, activeQuizSetId]);

  const managerPoll = usePollQuizSet(isInstructor ? activeQuizSetId : null);
  const studentPoll = usePollQuizQuestions(!isInstructor ? activeQuizSetId : null);
  const poll = isInstructor ? managerPoll : studentPoll;

  const jobStatus = mapJobStatus(poll.data?.status);
  const canGenerate = isInstructor && projectId != null && !generateQuiz.isPending;

  const summary = useMemo(() => poll.data ?? null, [poll.data]);
  const latestSummary = projectQuizSets.data?.[0] ?? null;

  const alreadyRated =
    activeQuizSetId != null &&
    latestSummary?.quizSetId === activeQuizSetId &&
    latestSummary.satisfactionRating != null;

  const satisfactionOpen =
    isInstructor &&
    summary?.status === 'COMPLETED' &&
    activeQuizSetId != null &&
    !alreadyRated &&
    satisfactionDismissedFor !== activeQuizSetId;

  const onGenerate = async () => {
    if (!isInstructor || projectId == null) return;
    const n = Number(count);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      setFormError('문항 수는 1–20 사이여야 합니다.');
      return;
    }
    setFormError(null);
    try {
      // 새로고침 직후 access 만료면 파일 병렬 GET 이 401 경합을 일으킨다 — 먼저 갱신한다.
      try {
        await refresh();
      } catch {
        // refresh 실패해도 getMe/파일 요청의 axios interceptor 가 한 번 더 시도한다.
      }

      const fileSummaries = await getProjectFiles(projectId);
      const files: Record<string, string> = {};
      // 동시 다발 GET 은 refresh 토큰 회전과 충돌하기 쉬워 순차로 읽는다.
      for (const f of fileSummaries.slice(0, 40)) {
        const body = await getProjectFileContent(projectId, f.path);
        files[body.path] = body.content;
      }
      if (Object.keys(files).length === 0) {
        setFormError('퀴즈 생성에 쓸 파일이 없습니다. 프로젝트를 먼저 임포트하세요.');
        return;
      }
      // Git versionHash 미구현 — 서버 @NotBlank/@Size(max=64) 만 만족하는 임의 값.
      const resolvedVersionHash = resolveQuizVersionHash(versionHash, projectId);
      generateQuiz.mutate(
        {
          projectId,
          mode,
          count: n,
          ratioEasy: 1,
          ratioNormal: 1,
          ratioHard: 1,
          userPrompt: userPrompt.trim() || undefined,
          versionHash: resolvedVersionHash,
          files,
        },
        {
          onSuccess: (res) => {
            setCreatedQuizSetId(res.quizSetId);
            saveSessionQuizSetId(sessionId, res.quizSetId);
            setSatisfactionDismissedFor(null);
          },
          onError: (err) => {
            setFormError(apiErrorMessage(err, '퀴즈 생성 요청에 실패했습니다.'));
          },
        },
      );
    } catch (err) {
      setFormError(apiErrorMessage(err, '프로젝트 파일을 불러오지 못했습니다.'));
    }
  };

  const dismissSatisfaction = () => {
    if (activeQuizSetId != null) setSatisfactionDismissedFor(activeQuizSetId);
    setSatisfactionComment('');
    setSatisfactionRating(0);
  };

  const onSubmitSatisfaction = () => {
    if (activeQuizSetId == null) return;
    if (satisfactionRating < 1) {
      setFormError('1–5점 중 만족도를 선택해 주세요.');
      return;
    }
    submitSatisfaction.mutate(
      {
        quizSetId: activeQuizSetId,
        rating: satisfactionRating,
        comment: satisfactionComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          dismissSatisfaction();
        },
        onError: (err) => {
          setFormError(apiErrorMessage(err, '만족도 저장에 실패했습니다.'));
        },
      },
    );
  };

  const restoring =
    projectId != null &&
    activeQuizSetId == null &&
    (projectQuizSets.isPending || projectQuizSets.isFetching);

  if (activeQuizSetId == null && projectId == null && !restoring) {
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

  const generatedCount =
    summary && isManagerSummary(summary) ? summary.generatedCount : null;
  const errorMessage =
    summary && isManagerSummary(summary) ? (summary.errorMessage ?? undefined) : undefined;
  const requestedCount = summary?.requestedCount ?? latestSummary?.requestedCount ?? null;
  const stageHint =
    summary?.status === 'GENERATING' && summary.generationStage
      ? ` · ${summary.generationStage}`
      : '';

  const showGeneratingPlaceholder =
    activeQuizSetId != null &&
    (poll.isPending ||
      summary?.status === 'QUEUED' ||
      summary?.status === 'GENERATING' ||
      (latestSummary?.quizSetId === activeQuizSetId &&
        (latestSummary.status === 'QUEUED' || latestSummary.status === 'GENERATING') &&
        summary == null));

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

      {restoring ? (
        <AsyncJobPanel
          label="AI 퀴즈"
          status="GENERATING"
          title="퀴즈 상태 불러오는 중"
          description="이전 세션의 퀴즈 생성을 복원하고 있습니다."
        />
      ) : null}

      {activeQuizSetId != null ? (
        <AsyncJobPanel
          label="AI 퀴즈"
          status={
            jobStatus ??
            (showGeneratingPlaceholder ? 'GENERATING' : summary?.status === 'FAILED' ? 'FAILED' : 'PENDING')
          }
          title={
            summary?.status === 'COMPLETED'
              ? `퀴즈셋 #${activeQuizSetId} 생성 완료`
              : summary?.status === 'FAILED' || latestSummary?.status === 'FAILED'
                ? `퀴즈셋 #${activeQuizSetId} 실패`
                : `퀴즈셋 #${activeQuizSetId} 생성 중${stageHint}`
          }
          description={
            summary
              ? generatedCount != null
                ? `요청 ${summary.requestedCount} · 생성 ${generatedCount}`
                : `요청 ${summary.requestedCount}문항`
              : showGeneratingPlaceholder
                ? '생성 중입니다. 새로고침해도 이어서 표시됩니다.'
                : '상태를 확인하는 중…'
          }
          done={generatedCount}
          total={requestedCount}
          errorMessage={errorMessage ?? latestSummary?.errorMessage ?? undefined}
          meta={
            isInstructor
              ? `GET /quiz?project · #${activeQuizSetId} 복원 · 소켓 알림 시 갱신`
              : `GET /quiz/${activeQuizSetId}/questions · 정답·해설 제외`
          }
        >
          {summary?.status === 'COMPLETED' && summary.quizzes.length > 0 ? (
            isInstructor && isManagerSummary(summary) ? (
              <ManagerQuizList quizzes={summary.quizzes} />
            ) : (
              <StudentQuizList quizzes={summary.quizzes as QuizQuestionItem[]} />
            )
          ) : null}
        </AsyncJobPanel>
      ) : null}

      <Modal
        open={satisfactionOpen}
        onClose={dismissSatisfaction}
        title="퀴즈 만족도"
        description="생성된 퀴즈 품질을 평가해 주세요."
        primaryLabel={submitSatisfaction.isPending ? '저장 중…' : '제출'}
        secondaryLabel="나중에"
        onPrimary={onSubmitSatisfaction}
        onSecondary={dismissSatisfaction}
        width={420}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSatisfactionRating(n)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border:
                    satisfactionRating === n
                      ? '1px solid var(--accent-strong)'
                      : '1px solid var(--border)',
                  background:
                    satisfactionRating === n ? 'var(--status-accent-bg)' : 'var(--surface-sunken)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <Input
            value={satisfactionComment}
            onChange={(e) => setSatisfactionComment(e.target.value)}
            placeholder="의견 (선택)"
            width="100%"
          />
        </div>
      </Modal>
    </div>
  );
}
