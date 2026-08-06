import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { isAxiosError } from 'axios';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  formatQuizSource,
  getProjectFileContent,
  getProjectFiles,
  humanizeApiError,
  useGenerateQuiz,
  useGetQuizProgress,
  useMeOptional,
  usePollQuizQuestions,
  usePollQuizSet,
  useQuizSetsByProject,
  useSubmitQuizProgress,
  useSubmitQuizSatisfaction,
  type QuizItem,
  type QuizProgressItem,
  type QuizQuestionItem,
  type QuizQuestionsResponse,
  type QuizSetDetailResponse,
} from '../../data';
import { getQuizProgress } from '../../network/quiz/quiz-apis';
import { refresh } from '../../network/auth/auth-apis';
import {
  loadSessionQuizSetId,
  saveSessionQuizSetId,
} from './sessionProjectStorage';
import {
  QuizSourcePickerModal,
} from './QuizSourcePickerModal';
import {
  pathsInQuizScope,
  sortQuizTargetFiles,
  type QuizSourceSelection,
} from './quizSourceScope';
import { AlertBanner, AsyncJobPanel, Badge, Button, Input } from '../../ds';
import { InstructorQuizMonitor } from './InstructorQuizMonitor';
import {
  IncorrectRetryPlayer,
  type IncorrectRetryQuestion,
} from './IncorrectRetryPlayer';
import type { QuizProgressEvent } from '../../realtime/useSessionSocket';

type SessionQuizPanelProps = {
  sessionId: number;
  projectId: number | null;
  versionHash: string | null;
  /** 세션 웹소켓(`/topic/sessions/{id}/quiz`)으로 도착한 퀴즈셋 id. 다른 참여자가 만든 것도 여기로 들어온다. */
  pushedQuizSetId?: number | null;
  /** 강사 또는 그룹 리더 — 퀴즈 생성·재생성 UI */
  canGenerateQuiz?: boolean;
  /** 강사 현황판 실시간 집계 (`/topic/sessions/{id}/quiz-progress`) */
  liveQuizProgress?: QuizProgressEvent | null;
};

type PlayableChoice = { idx: number; content: string; answer?: boolean };
type PlayableQuiz = {
  id: number;
  orderNo: number;
  type: string;
  difficulty: string;
  purpose?: string;
  testedConcept: string;
  question: string;
  explanation?: string | null;
  filePath: string;
  lineStart: number | null;
  lineEnd: number | null;
  choices: PlayableChoice[];
};

type QuizResult = {
  isCorrect: boolean | null;
  explanation: string | null;
  correctChoiceIdx: number | null;
  status: 'ATTEMPTED' | 'SKIPPED';
};

function mapProgressItemToResult(item: QuizProgressItem): QuizResult {
  return {
    status: item.status === 'ATTEMPTED' ? 'ATTEMPTED' : 'SKIPPED',
    isCorrect: item.isCorrect,
    explanation: item.explanation,
    correctChoiceIdx: item.correctChoiceIdx,
  };
}

function progressItemsToMaps(items: QuizProgressItem[]): {
  answers: Record<number, number>;
  results: Record<number, QuizResult>;
} {
  const answers: Record<number, number> = {};
  const results: Record<number, QuizResult> = {};
  for (const item of items) {
    results[item.quizId] = mapProgressItemToResult(item);
    if (item.chosenChoiceIdx != null) {
      answers[item.quizId] = item.chosenChoiceIdx;
    }
  }
  return { answers, results };
}

function isManagerSummary(
  summary: QuizSetDetailResponse | QuizQuestionsResponse,
): summary is QuizSetDetailResponse {
  return 'generatedCount' in summary;
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

function toPlayableQuizzes(
  summary: QuizSetDetailResponse | QuizQuestionsResponse,
): PlayableQuiz[] {
  if (isManagerSummary(summary)) {
    return summary.quizzes.map((q: QuizItem) => ({
      id: q.id,
      orderNo: q.orderNo,
      type: q.type,
      difficulty: q.difficulty,
      purpose: q.purpose,
      testedConcept: q.testedConcept,
      question: q.question,
      explanation: q.explanation,
      filePath: q.filePath,
      lineStart: q.lineStart,
      lineEnd: q.lineEnd,
      choices: q.choices.map((c) => ({ idx: c.idx, content: c.content, answer: c.answer })),
    }));
  }
  return summary.quizzes.map((q: QuizQuestionItem) => ({
    id: q.id,
    orderNo: q.orderNo,
    type: q.type,
    difficulty: q.difficulty,
    testedConcept: q.testedConcept,
    question: q.question,
    filePath: q.filePath,
    lineStart: q.lineStart,
    lineEnd: q.lineEnd,
    choices: q.choices.map((c) => ({ idx: c.idx, content: c.content })),
  }));
}

function dedupeQuizzesByOrder(quizzes: PlayableQuiz[]): PlayableQuiz[] {
  const seen = new Set<number>();
  return quizzes.filter((q) => {
    if (seen.has(q.orderNo)) return false;
    seen.add(q.orderNo);
    return true;
  });
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

function CircularLoader({ size = 22 }: { size?: number }) {
  return (
    <span
      aria-label="퀴즈 생성 중"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        display: 'inline-block',
        animation: 'qurie-spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

function QuizEmptyState({
  title = '아직 퀴즈가 생성되지 않았어요',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '32px 16px',
        borderRadius: 12,
        border: '2px dashed var(--border-strong)',
        background: 'var(--status-accent-bg)',
        textAlign: 'center',
      }}
    >
      <Sparkles
        size={28}
        strokeWidth={1.75}
        color="var(--accent)"
        style={{ animation: 'qurie-float 2.4s ease-in-out infinite' }}
      />
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>
        {title}
      </span>
      {description ? (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 280 }}>
          {description}
        </span>
      ) : null}
    </div>
  );
}

function QuizGeneratingBanner({
  done,
  total,
}: {
  done?: number | null;
  total?: number | null;
}) {
  const hasProgress = done != null && total != null && total > 0;
  const pct = hasProgress ? Math.min(100, Math.round((done / total) * 100)) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '32px 16px',
        borderRadius: 12,
        border: '2px dashed var(--border-strong)',
        background: 'var(--status-accent-bg)',
        textAlign: 'center',
        minHeight: 220,
      }}
    >
      <Sparkles
        size={28}
        strokeWidth={1.75}
        color="var(--accent)"
        style={{ animation: 'qurie-float 2.4s ease-in-out infinite' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>퀴즈를 만들고 있어요</span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 280 }}>
          {hasProgress
            ? `${done}/${total}문항 준비됨 · 생성이 끝나면 자동으로 표시돼요`
            : 'AI가 문항을 만들고 있어요. 잠시만 기다려 주세요.'}
        </span>
      </div>
      <CircularLoader size={22} />
      <div
        style={{
          height: 8,
          borderRadius: 999,
          width: '100%',
          maxWidth: 280,
          background: 'var(--surface-sunken)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {hasProgress ? (
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 999,
              transition: 'width 320ms ease-out',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '32%',
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 999,
              animation: 'qurie-progress 1.5s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = [
  'var(--accent)',
  'var(--status-success)',
  'var(--status-warning)',
  'var(--status-error)',
  'var(--chart-accent)',
  'var(--accent-strong)',
];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 7) * 0.08}s`,
        duration: `${1.6 + (i % 5) * 0.15}s`,
        dx: `${((i % 11) - 5) * 18}px`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 3) * 2,
      })),
    [],
  );

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              '--dx': p.dx,
              position: 'absolute',
              left: p.left,
              top: -8,
              width: p.size,
              height: p.size,
              borderRadius: p.id % 2 === 0 ? 2 : '50%',
              background: p.color,
              animation: `qurie-confetti-fall ${p.duration} ease-out ${p.delay} forwards`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function QuizCompleteScreen({
  correct,
  total,
  incorrectCount,
  onReview,
  onRetryIncorrect,
}: {
  correct: number;
  total: number;
  incorrectCount: number;
  onReview: () => void;
  onRetryIncorrect?: () => void;
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginTop: 12,
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '36px 20px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minHeight: 260,
        overflow: 'hidden',
        background: 'var(--status-success-bg)',
      }}
    >
      <ConfettiBurst />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          animation: 'qurie-pop-in 0.45s ease-out',
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {correct}/{total}
        </span>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>퀴즈 완료</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-success)' }}>
          수고했어요!
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
          정답 {correct}개 · 전체 {total}문항
        </span>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          <Button variant="ghost" size="sm" onClick={onReview}>
            문항 다시 보기
          </Button>
          {incorrectCount > 0 && onRetryIncorrect ? (
            <Button variant="secondary" size="sm" onClick={onRetryIncorrect}>
              오답 다시 풀기 ({incorrectCount})
            </Button>
          ) : null}
        </div>
        {incorrectCount > 0 && onRetryIncorrect ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            연습 결과는 리포트에 반영되지 않습니다
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SingleQuizPlayer({
  quizzes,
  requestedCount,
  generating,
  answers,
  onToggleChoice,
  results,
  onSubmit,
  onSkip,
  submitting,
  warnMessage,
  onNotReady,
  onClearWarn,
  showComplete,
  completeCorrect,
  completeTotal,
  completeIncorrectCount,
  onReviewFromComplete,
  onRetryIncorrect,
  initialIndex = 0,
  onFinish,
}: {
  quizzes: PlayableQuiz[];
  requestedCount: number;
  generating: boolean;
  answers: Record<number, number>;
  onToggleChoice: (quizId: number, choiceIdx: number) => void;
  results: Record<number, QuizResult>;
  onSubmit: (quiz: PlayableQuiz) => void;
  onSkip: (quiz: PlayableQuiz) => void;
  submitting: boolean;
  warnMessage: string | null;
  onNotReady: () => void;
  onClearWarn: () => void;
  showComplete: boolean;
  completeCorrect: number;
  completeTotal: number;
  completeIncorrectCount: number;
  onReviewFromComplete: () => void;
  onRetryIncorrect?: () => void;
  /** 서버 progress 복원 시 시작할 문항 인덱스 (마운트 시 1회) */
  initialIndex?: number;
  /** 마지막 문항 채점/건너뛰기 후 완료 화면으로 넘어갈 때 */
  onFinish?: () => void;
}) {
  const totalSlots = Math.max(requestedCount, quizzes.length, 1);
  const [index, setIndex] = useState(() => Math.max(0, initialIndex));
  const [hovered, setHovered] = useState(false);
  const currentIndex = Math.min(index, Math.max(0, totalSlots - 1));

  const ready = currentIndex < quizzes.length;
  const q = ready ? quizzes[currentIndex] : null;
  const selected = q != null ? answers[q.id] : undefined;
  const hasSelection = selected != null;
  const result = q != null ? results[q.id] : undefined;
  const revealed = result?.status === 'ATTEMPTED';
  const skipped = result?.status === 'SKIPPED';
  const locked = revealed || skipped;

  const tryGo = (next: number) => {
    if (next < 0 || next >= totalSlots) return;
    if (next >= quizzes.length) {
      onNotReady();
      return;
    }
    onClearWarn();
    setIndex(next);
  };

  if (showComplete) {
    return (
      <QuizCompleteScreen
        correct={completeCorrect}
        total={completeTotal}
        incorrectCount={completeIncorrectCount}
        onReview={onReviewFromComplete}
        onRetryIncorrect={onRetryIncorrect}
      />
    );
  }

  const hasNextReady = currentIndex < quizzes.length - 1;

  return (
    <div
      style={{ position: 'relative', marginTop: 12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 280,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {currentIndex + 1} / {totalSlots}
          </span>
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: 'var(--surface-sunken)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(((currentIndex + 1) / totalSlots) * 100)}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 999,
                transition: 'width 220ms ease-out',
              }}
            />
          </div>
        </div>

        {warnMessage ? (
          <AlertBanner
            tone="warning"
            title={warnMessage}
            actionLabel="확인"
            onAction={onClearWarn}
          />
        ) : null}

        {!ready || q == null ? (
          generating ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '28px 8px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                다음 문항을 준비하는 중이에요
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                준비되면 이 자리에 표시됩니다
              </span>
            </div>
          ) : (
            <QuizEmptyState />
          )
        ) : (
          <>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.choices.map((c) => {
                  const isSelected = selected === c.idx;
                  const isCorrectChoice =
                    revealed &&
                    (c.answer === true ||
                      (result?.correctChoiceIdx != null && result.correctChoiceIdx === c.idx));
                  const isWrongSelected =
                    revealed && isSelected && result?.isCorrect === false;
                  return (
                    <button
                      key={c.idx}
                      type="button"
                      onClick={() => {
                        if (locked) return;
                        onToggleChoice(q.id, c.idx);
                      }}
                      disabled={locked}
                      style={{
                        textAlign: 'left',
                        fontSize: 12.5,
                        color: isCorrectChoice
                          ? 'var(--status-success)'
                          : isWrongSelected
                            ? 'var(--status-error)'
                            : 'var(--ink)',
                        fontWeight: isCorrectChoice || isSelected ? 600 : 400,
                        lineHeight: 1.45,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: isCorrectChoice
                          ? '1px solid var(--status-success)'
                          : isWrongSelected
                            ? '1px solid var(--status-error)'
                            : isSelected
                              ? '1px solid var(--accent-strong)'
                              : '1px solid var(--border)',
                        background: isCorrectChoice
                          ? 'var(--status-success-bg)'
                          : isWrongSelected
                            ? 'var(--status-error-bg)'
                            : isSelected
                              ? 'var(--status-accent-bg)'
                              : 'var(--surface-sunken)',
                        cursor: locked ? 'default' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {c.idx + 1}. {c.content}
                      {isCorrectChoice ? <span style={{ marginLeft: 6 }}>정답</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {revealed ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingTop: 6,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: result?.isCorrect ? 'var(--status-success)' : 'var(--status-error)',
                  }}
                >
                  {result?.isCorrect ? '정답이에요' : '오답이에요'}
                </span>
                {result?.explanation ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    AI 해설 · {result.explanation}
                  </span>
                ) : null}
              </div>
            ) : null}

            {skipped ? (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>이 문항은 건너뛰었어요.</span>
            ) : null}

            {!locked ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={hasSelection || submitting}
                  onClick={() => onSkip(q)}
                >
                  건너뛰기
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!hasSelection || submitting}
                  onClick={() => onSubmit(q)}
                >
                  {submitting ? '제출 중…' : '제출'}
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                {hasNextReady ? (
                  <Button variant="primary" size="sm" onClick={() => tryGo(currentIndex + 1)}>
                    다음 문항
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => onFinish?.()}>
                    결과 보기
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {hovered && currentIndex > 0 ? (
        <button
          type="button"
          aria-label="이전 문항"
          onClick={() => tryGo(currentIndex - 1)}
          style={{
            position: 'absolute',
            left: -6,
            top: 140,
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-modal)',
            boxShadow: 'var(--shadow-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink)',
            zIndex: 2,
          }}
        >
          <ChevronLeft size={16} />
        </button>
      ) : null}
      {hovered && currentIndex < totalSlots - 1 ? (
        <button
          type="button"
          aria-label="다음 문항"
          onClick={() => tryGo(currentIndex + 1)}
          style={{
            position: 'absolute',
            right: -6,
            top: 140,
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-modal)',
            boxShadow: 'var(--shadow-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink)',
            zIndex: 2,
          }}
        >
          <ChevronRight size={16} />
        </button>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {Array.from({ length: totalSlots }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번 문항`}
            onClick={() => tryGo(i)}
            style={{
              width: i === currentIndex ? 18 : 8,
              height: 8,
              borderRadius: 999,
              border: 'none',
              background: i === currentIndex ? 'var(--accent)' : i < quizzes.length ? 'var(--border-strong)' : 'var(--border)',
              cursor: 'pointer',
              transition: 'width 160ms ease, background 160ms ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SatisfactionSticky({
  rating,
  comment,
  submitting,
  onRating,
  onComment,
  onSubmit,
  onDismiss,
}: {
  rating: number;
  comment: string;
  submitting: boolean;
  onRating: (n: number) => void;
  onComment: (v: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        marginTop: 'auto',
        borderTop: '1px solid var(--border-strong)',
        border: '1px solid var(--border-strong)',
        borderRadius: 12,
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '14px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>퀴즈 만족도</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          문항을 모두 풀었습니다. 생성된 퀴즈 품질을 평가해 주세요.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRating(n)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: rating === n ? '1px solid var(--accent-strong)' : '1px solid var(--border)',
              background: rating === n ? 'var(--status-accent-bg)' : 'var(--surface-sunken)',
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
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        placeholder="의견 (선택)"
        width="100%"
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onDismiss}>
          나중에
        </Button>
        <Button variant="primary" disabled={submitting || rating < 1} onClick={onSubmit}>
          {submitting ? '저장 중…' : '제출'}
        </Button>
      </div>
    </div>
  );
}

export function SessionQuizPanel({
  sessionId,
  projectId,
  versionHash,
  pushedQuizSetId = null,
  canGenerateQuiz = false,
  liveQuizProgress = null,
}: SessionQuizPanelProps) {
  const meQuery = useMeOptional();
  const role = meQuery.isSuccess ? meQuery.data?.role : undefined;
  const isInstructor = role === 'MANAGER' || role === 'MASTER';
  const canManageQuiz = canGenerateQuiz;

  const generateQuiz = useGenerateQuiz();
  const submitSatisfaction = useSubmitQuizSatisfaction();
  const submitProgress = useSubmitQuizProgress();
  /** 퀴즈 개수는 전역 고정(5). UI에서 변경하지 않는다. */
  const QUIZ_COUNT = 5;
  const [userPrompt, setUserPrompt] = useState('');
  const [createdQuizSetId, setCreatedQuizSetId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [navWarn, setNavWarn] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lastSource, setLastSource] = useState<QuizSourceSelection | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [satisfactionComment, setSatisfactionComment] = useState('');
  const [satisfactionDismissedFor, setSatisfactionDismissedFor] = useState<number | null>(null);
  const [answersBySet, setAnswersBySet] = useState<Record<number, Record<number, number>>>({});
  const [resultsBySet, setResultsBySet] = useState<Record<number, Record<number, QuizResult>>>({});
  const [startedAtBySet, setStartedAtBySet] = useState<Record<number, Record<number, string>>>({});
  const [reviewingCompleteFor, setReviewingCompleteFor] = useState<number | null>(null);
  /** 마지막 문항에서 「결과 보기」를 누른 뒤에만 완료 화면을 연다 — 정답/오답 확인 시간을 확보한다. */
  const [readyForComplete, setReadyForComplete] = useState(false);
  const [readyCompleteQuizSetId, setReadyCompleteQuizSetId] = useState<number | null>(null);
  const [conflictEpoch, setConflictEpoch] = useState(0);
  /** 오답 연습 모드 — 서버 progress 미제출, 리포트 미반영 */
  const [retryingIncorrect, setRetryingIncorrect] = useState(false);

  const projectQuizSets = useQuizSetsByProject(projectId);

  const activeQuizSetId = useMemo(() => {
    if (createdQuizSetId != null) return createdQuizSetId;
    if (pushedQuizSetId != null) return pushedQuizSetId;
    const fromServer = projectQuizSets.data?.[0]?.quizSetId ?? null;
    if (fromServer != null) return fromServer;
    const cached = loadSessionQuizSetId(sessionId);
    return cached;
  }, [sessionId, projectQuizSets.data, pushedQuizSetId, createdQuizSetId]);

  useEffect(() => {
    if (activeQuizSetId == null) return;
    saveSessionQuizSetId(sessionId, activeQuizSetId);
  }, [sessionId, activeQuizSetId]);

  if (activeQuizSetId !== readyCompleteQuizSetId) {
    setReadyCompleteQuizSetId(activeQuizSetId);
    setReadyForComplete(false);
    setReviewingCompleteFor(null);
    setRetryingIncorrect(false);
  }

  const progressQuery = useGetQuizProgress(activeQuizSetId);
  const serverMaps = useMemo(
    () => progressItemsToMaps(progressQuery.data?.items ?? []),
    [progressQuery.data],
  );

  const answers = useMemo(() => {
    const local = activeQuizSetId != null ? (answersBySet[activeQuizSetId] ?? {}) : {};
    return { ...serverMaps.answers, ...local };
  }, [activeQuizSetId, answersBySet, serverMaps.answers]);

  const results = useMemo(() => {
    const local = activeQuizSetId != null ? (resultsBySet[activeQuizSetId] ?? {}) : {};
    return { ...serverMaps.results, ...local };
  }, [activeQuizSetId, resultsBySet, serverMaps.results]);

  const startedAts = activeQuizSetId != null ? (startedAtBySet[activeQuizSetId] ?? {}) : {};

  const applyProgressSummary = (items: QuizProgressItem[], quizSetId: number) => {
    const mapped = progressItemsToMaps(items);
    setAnswersBySet((prev) => ({
      ...prev,
      [quizSetId]: { ...(prev[quizSetId] ?? {}), ...mapped.answers },
    }));
    setResultsBySet((prev) => ({
      ...prev,
      [quizSetId]: { ...(prev[quizSetId] ?? {}), ...mapped.results },
    }));
  };

  const onProgressConflict = async (quizSetId: number) => {
    try {
      const summary = await getQuizProgress(quizSetId);
      applyProgressSummary(summary.items, quizSetId);
      setConflictEpoch((n) => n + 1);
    } catch {
      setFormError('이미 응시한 문항입니다. 새로고침 후 다시 확인해 주세요.');
    }
  };
  const managerPoll = usePollQuizSet(isInstructor ? activeQuizSetId : null);
  const studentPoll = usePollQuizQuestions(!isInstructor ? activeQuizSetId : null);
  const poll = isInstructor ? managerPoll : studentPoll;

  const summary = useMemo(() => poll.data ?? null, [poll.data]);
  const latestSummary = projectQuizSets.data?.[0] ?? null;
  const generatingInFlight =
    generateQuiz.isPending ||
    summary?.status === 'QUEUED' ||
    summary?.status === 'GENERATING';
  const canGenerate =
    canManageQuiz && projectId != null && !generateQuiz.isPending && !generatingInFlight;

  const playableQuizzes = useMemo(() => {
    if (!summary || summary.quizzes.length === 0) return [];
    return dedupeQuizzesByOrder(toPlayableQuizzes(summary));
  }, [summary]);

  const allHandled =
    playableQuizzes.length > 0 &&
    summary?.status === 'COMPLETED' &&
    playableQuizzes.every((q) => results[q.id] != null);

  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.isCorrect === true).length,
    [results],
  );

  const incorrectRetryQuestions = useMemo((): IncorrectRetryQuestion[] => {
    return playableQuizzes
      .filter((q) => results[q.id]?.isCorrect === false)
      .map((q) => {
        const result = results[q.id];
        const fromChoices = q.choices.find((c) => c.answer)?.idx;
        const correctChoiceIdx = result?.correctChoiceIdx ?? fromChoices ?? null;
        if (correctChoiceIdx == null) return null;
        return {
          id: q.id,
          orderNo: q.orderNo,
          question: q.question,
          choices: q.choices.map((c) => ({ idx: c.idx, content: c.content })),
          correctChoiceIdx,
          explanation: result?.explanation ?? q.explanation ?? null,
        };
      })
      .filter((q): q is IncorrectRetryQuestion => q != null);
  }, [playableQuizzes, results]);

  // 재입장 시 서버에 이미 전부 응시된 세트는 완료 화면을 바로 연다 (풀이 중 마지막 제출과는 분리).
  const serverAlreadyComplete = useMemo(() => {
    if (activeQuizSetId == null) return false;
    if (!progressQuery.isSuccess || playableQuizzes.length === 0) return false;
    if (summary?.status !== 'COMPLETED') return false;
    const serverResults = progressItemsToMaps(progressQuery.data?.items ?? []).results;
    return playableQuizzes.every((q) => serverResults[q.id] != null);
  }, [
    activeQuizSetId,
    playableQuizzes,
    progressQuery.data?.items,
    progressQuery.isSuccess,
    summary?.status,
  ]);

  const showCompleteScreen =
    allHandled &&
    (readyForComplete || serverAlreadyComplete) &&
    activeQuizSetId != null &&
    reviewingCompleteFor !== activeQuizSetId;

  const resumeIndex = useMemo(() => {
    if (playableQuizzes.length === 0) return 0;
    const firstOpen = playableQuizzes.findIndex((q) => results[q.id] == null);
    return firstOpen >= 0 ? firstOpen : 0;
  }, [playableQuizzes, results]);

  const progressHydrated =
    progressQuery.isSuccess && (progressQuery.data?.items.length ?? 0) > 0;
  const localResultCount =
    activeQuizSetId != null ? Object.keys(resultsBySet[activeQuizSetId] ?? {}).length : 0;
  // 서버 progress 로 재입장 복원할 때만 remount. 첫 제출 직후 hydrate 로 remount 하면 다음 문항으로 점프한다.
  const bootstrapMount = progressHydrated && localResultCount === 0 ? 1 : 0;
  const inReviewMode = reviewingCompleteFor === activeQuizSetId;
  const playerMountKey = `${activeQuizSetId ?? 0}-${inReviewMode ? 'review' : 'play'}-${bootstrapMount}-${conflictEpoch}`;

  const alreadyRated =
    activeQuizSetId != null &&
    latestSummary?.quizSetId === activeQuizSetId &&
    latestSummary.satisfactionRating != null;

  const satisfactionVisible =
    summary?.status === 'COMPLETED' &&
    allHandled &&
    activeQuizSetId != null &&
    !alreadyRated &&
    satisfactionDismissedFor !== activeQuizSetId;

  const ensureStarted = (quizId: number) => {
    if (activeQuizSetId == null) return new Date().toISOString();
    const existing = startedAts[quizId];
    if (existing) return existing;
    const now = new Date().toISOString();
    setStartedAtBySet((prev) => ({
      ...prev,
      [activeQuizSetId]: { ...(prev[activeQuizSetId] ?? {}), [quizId]: now },
    }));
    return now;
  };

  const openSourcePicker = () => {
    if (!canManageQuiz || projectId == null) return;
    setFormError(null);
    setPickerOpen(true);
  };

  const onGenerateFromSource = async (selection: QuizSourceSelection) => {
    if (!canManageQuiz || projectId == null) return;
    const n = QUIZ_COUNT;
    setFormError(null);
    try {
      try {
        await refresh();
      } catch {
        // refresh 실패해도 이후 요청에서 interceptor 가 재시도한다.
      }

      const fileSummaries = await getProjectFiles(projectId);
      const allPaths = fileSummaries.map((f) => f.path);
      const scopedPaths = sortQuizTargetFiles(pathsInQuizScope(allPaths, selection)).slice(0, 40);
      if (scopedPaths.length === 0) {
        setFormError('선택한 대상에 퀴즈 생성에 쓸 파일이 없습니다.');
        return;
      }

      const files: Record<string, string> = {};
      for (const path of scopedPaths) {
        const body = await getProjectFileContent(projectId, path);
        files[body.path] = body.content;
      }

      const resolvedVersionHash = resolveQuizVersionHash(versionHash, projectId);
      generateQuiz.mutate(
        {
          projectId,
          mode: 'PRACTICE',
          count: n,
          ratioEasy: 1,
          ratioNormal: 1,
          ratioHard: 1,
          userPrompt: userPrompt.trim() || undefined,
          versionHash: resolvedVersionHash,
          targetFiles: scopedPaths,
          files,
        },
        {
          onSuccess: (res) => {
            setCreatedQuizSetId(res.quizSetId);
            saveSessionQuizSetId(sessionId, res.quizSetId);
            setLastSource(selection);
            setPickerOpen(false);
            setSatisfactionDismissedFor(null);
            setSatisfactionRating(0);
            setSatisfactionComment('');
            setReviewingCompleteFor(null);
          },
          onError: (err) => {
            setFormError(humanizeApiError(err, '퀴즈 생성 요청에 실패했습니다.'));
          },
        },
      );
    } catch (err) {
      setFormError(humanizeApiError(err, '프로젝트 파일을 불러오지 못했습니다.'));
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
          setFormError(humanizeApiError(err, '만족도 저장에 실패했습니다.'));
        },
      },
    );
  };

  const gradeLocally = (quiz: PlayableQuiz, choiceIdx: number): QuizResult => {
    const correct = quiz.choices.find((c) => c.answer === true);
    const isCorrect = correct != null ? correct.idx === choiceIdx : null;
    return {
      status: 'ATTEMPTED',
      isCorrect,
      explanation: quiz.explanation ?? null,
      correctChoiceIdx: correct?.idx ?? null,
    };
  };

  const onSubmitQuiz = (quiz: PlayableQuiz) => {
    if (activeQuizSetId == null) return;
    if (results[quiz.id] != null) return;
    const choiceIdx = answers[quiz.id];
    if (choiceIdx == null) return;
    const startedAt = ensureStarted(quiz.id);
    const finishedAt = new Date().toISOString();

    // 강사는 이미 정답·해설을 갖고 있어 로컬 채점. 학생은 progress API.
    if (isInstructor && quiz.choices.some((c) => c.answer != null)) {
      setResultsBySet((prev) => ({
        ...prev,
        [activeQuizSetId]: {
          ...(prev[activeQuizSetId] ?? {}),
          [quiz.id]: gradeLocally(quiz, choiceIdx),
        },
      }));
      // 재입장 복원을 위해 서버에도 응시 기록을 남긴다.
      submitProgress.mutate(
        {
          quizSetId: activeQuizSetId,
          quizId: quiz.id,
          status: 'ATTEMPTED',
          chosenChoiceIdx: choiceIdx,
          startedAt,
          finishedAt,
        },
        {
          onError: (err) => {
            if (isAxiosError(err) && err.response?.status === 409) {
              void onProgressConflict(activeQuizSetId);
              return;
            }
            // 로컬 결과는 이미 반영됨 — 서버 저장 실패만 안내
            setFormError(humanizeApiError(err, '응시 기록 저장에 실패했습니다.'));
          },
        },
      );
      return;
    }

    submitProgress.mutate(
      {
        quizSetId: activeQuizSetId,
        quizId: quiz.id,
        status: 'ATTEMPTED',
        chosenChoiceIdx: choiceIdx,
        startedAt,
        finishedAt,
      },
      {
        onSuccess: (res) => {
          setResultsBySet((prev) => ({
            ...prev,
            [activeQuizSetId]: {
              ...(prev[activeQuizSetId] ?? {}),
              [quiz.id]: {
                status: 'ATTEMPTED',
                isCorrect: res.isCorrect,
                explanation: res.explanation,
                correctChoiceIdx: res.correctChoiceIdx,
              },
            },
          }));
        },
        onError: (err) => {
          if (isAxiosError(err) && err.response?.status === 409) {
            void onProgressConflict(activeQuizSetId);
            return;
          }
          setFormError(humanizeApiError(err, '제출에 실패했습니다.'));
        },
      },
    );
  };

  const onSkipQuiz = (quiz: PlayableQuiz) => {
    if (activeQuizSetId == null) return;
    if (results[quiz.id] != null) return;
    if (answers[quiz.id] != null) return;
    const startedAt = ensureStarted(quiz.id);
    const finishedAt = new Date().toISOString();

    const markSkipped = () => {
      setResultsBySet((prev) => ({
        ...prev,
        [activeQuizSetId]: {
          ...(prev[activeQuizSetId] ?? {}),
          [quiz.id]: {
            status: 'SKIPPED',
            isCorrect: null,
            explanation: null,
            correctChoiceIdx: null,
          },
        },
      }));
    };

    if (isInstructor) {
      markSkipped();
      submitProgress.mutate(
        {
          quizSetId: activeQuizSetId,
          quizId: quiz.id,
          status: 'SKIPPED',
          chosenChoiceIdx: null,
          startedAt,
          finishedAt,
        },
        {
          onError: (err) => {
            if (isAxiosError(err) && err.response?.status === 409) {
              void onProgressConflict(activeQuizSetId);
            }
          },
        },
      );
      return;
    }

    submitProgress.mutate(
      {
        quizSetId: activeQuizSetId,
        quizId: quiz.id,
        status: 'SKIPPED',
        chosenChoiceIdx: null,
        startedAt,
        finishedAt,
      },
      {
        onSuccess: () => markSkipped(),
        onError: (err) => {
          if (isAxiosError(err) && err.response?.status === 409) {
            void onProgressConflict(activeQuizSetId);
            return;
          }
          setFormError(humanizeApiError(err, '건너뛰기에 실패했습니다.'));
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
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>
        <QuizEmptyState
          description={
            canManageQuiz
              ? '프로젝트를 임포트한 뒤 퀴즈를 생성할 수 있습니다.'
              : '강사가 퀴즈를 생성하면 여기에 표시됩니다.'
          }
        />
      </div>
    );
  }

  if (!isInstructor && !canManageQuiz && activeQuizSetId == null && !restoring) {
    return (
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>
        <QuizEmptyState description="강사가 퀴즈를 생성하면 여기에 표시됩니다." />
      </div>
    );
  }

  const generatedCount =
    summary && isManagerSummary(summary)
      ? summary.generatedCount
      : playableQuizzes.length > 0
        ? playableQuizzes.length
        : null;
  const errorMessage =
    summary && isManagerSummary(summary) ? (summary.errorMessage ?? undefined) : undefined;
  const requestedCount = summary?.requestedCount ?? latestSummary?.requestedCount ?? null;

  const showGeneratingPlaceholder =
    activeQuizSetId != null &&
    (poll.isPending ||
      summary?.status === 'QUEUED' ||
      summary?.status === 'GENERATING' ||
      (latestSummary?.quizSetId === activeQuizSetId &&
        (latestSummary.status === 'QUEUED' || latestSummary.status === 'GENERATING') &&
        summary == null));

  const showQuizPlayer = playableQuizzes.length > 0;
  const generating =
    summary?.status === 'QUEUED' ||
    summary?.status === 'GENERATING' ||
    Boolean(showGeneratingPlaceholder && summary?.status !== 'COMPLETED');
  const waitingForFirstQuestion =
    playableQuizzes.length === 0 &&
    (generateQuiz.isPending || generatingInFlight || generating || showGeneratingPlaceholder);
  const showCreateForm =
    canManageQuiz &&
    projectId != null &&
    playableQuizzes.length === 0 &&
    !showGeneratingPlaceholder &&
    !generatingInFlight;
  const showRegenerate =
    canManageQuiz &&
    projectId != null &&
    (playableQuizzes.length > 0 || summary?.status === 'COMPLETED') &&
    !generatingInFlight;
  const showGeneratingBanner = waitingForFirstQuestion;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>
        {showRegenerate ? (
          <Button variant="secondary" size="sm" disabled={!canGenerate} onClick={openSourcePicker}>
            퀴즈 재생성
          </Button>
        ) : null}
      </div>

      {formError ? (
        <AlertBanner
          tone="error"
          title="요청 실패"
          description={formError}
          actionLabel="닫기"
          onAction={() => setFormError(null)}
        />
      ) : null}

      {summary?.status === 'FAILED' || latestSummary?.status === 'FAILED' ? (
        <AlertBanner
          tone="error"
          title="퀴즈 생성 실패"
          description={errorMessage ?? latestSummary?.errorMessage ?? '다시 시도해 주세요.'}
          actionLabel="닫기"
          onAction={() => setFormError(null)}
        />
      ) : null}

      {showGeneratingBanner ? (
        <QuizGeneratingBanner done={generatedCount} total={requestedCount} />
      ) : null}

      {/* 강사는 퀴즈를 풀지 않고 학생 응시 현황만 본다. */}
      {isInstructor && activeQuizSetId != null && !waitingForFirstQuestion && summary?.status === 'COMPLETED' ? (
        <InstructorQuizMonitor quizSetId={activeQuizSetId} liveProgress={liveQuizProgress} />
      ) : null}

      {showQuizPlayer && !isInstructor && retryingIncorrect ? (
        <IncorrectRetryPlayer
          questions={incorrectRetryQuestions}
          onExit={() => setRetryingIncorrect(false)}
        />
      ) : null}

      {showQuizPlayer && !isInstructor && !retryingIncorrect ? (
        <SingleQuizPlayer
          key={playerMountKey}
          quizzes={playableQuizzes}
          requestedCount={requestedCount ?? playableQuizzes.length}
          generating={generating}
          answers={answers}
          onToggleChoice={(quizId, choiceIdx) => {
            if (activeQuizSetId == null) return;
            ensureStarted(quizId);
            setAnswersBySet((prev) => {
              const cur = prev[activeQuizSetId] ?? {};
              const next = { ...cur };
              if (next[quizId] === choiceIdx) {
                delete next[quizId];
              } else {
                next[quizId] = choiceIdx;
              }
              return { ...prev, [activeQuizSetId]: next };
            });
          }}
          results={results}
          onSubmit={onSubmitQuiz}
          onSkip={onSkipQuiz}
          submitting={submitProgress.isPending}
          warnMessage={navWarn}
          onNotReady={() => setNavWarn('아직 퀴즈가 생성되지 않았어요')}
          onClearWarn={() => setNavWarn(null)}
          showComplete={showCompleteScreen}
          completeCorrect={correctCount}
          completeTotal={playableQuizzes.length}
          completeIncorrectCount={incorrectRetryQuestions.length}
          onReviewFromComplete={() => {
            if (activeQuizSetId != null) setReviewingCompleteFor(activeQuizSetId);
          }}
          onRetryIncorrect={
            incorrectRetryQuestions.length > 0
              ? () => setRetryingIncorrect(true)
              : undefined
          }
          onFinish={() => setReadyForComplete(true)}
          initialIndex={inReviewMode ? 0 : resumeIndex}
        />
      ) : null}

      {showCreateForm ? (
        <>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            문항 수는 {QUIZ_COUNT}개로 고정됩니다.
          </span>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>추가 프롬프트</span>
            <Input
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="강조할 개념 (선택)"
              width="100%"
            />
          </label>

          <Button variant="primary" disabled={!canGenerate} onClick={openSourcePicker}>
            {generateQuiz.isPending || generatingInFlight ? '생성 중…' : '퀴즈 생성'}
          </Button>
          {latestSummary != null || activeQuizSetId != null ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              재생성 시 기존 퀴즈는 삭제되고, 이전 문항과 겹치지 않게 새로 출제됩니다.
            </span>
          ) : null}
          {lastSource ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              출제 대상:{' '}
              {lastSource.kind === 'dir' ? `${lastSource.path}/` : lastSource.path}
            </span>
          ) : null}
        </>
      ) : null}

      {pickerOpen && projectId != null ? (
        <QuizSourcePickerModal
          open={pickerOpen}
          projectId={projectId}
          initialSelection={lastSource}
          confirming={generateQuiz.isPending}
          onClose={() => setPickerOpen(false)}
          onConfirm={(selection) => {
            void onGenerateFromSource(selection);
          }}
        />
      ) : null}

      {restoring ? (
        <AsyncJobPanel
          label="AI 퀴즈"
          status="GENERATING"
          title="퀴즈 상태 불러오는 중"
          description="이전 세션의 퀴즈 생성을 복원하고 있습니다."
        />
      ) : null}

      {!showQuizPlayer && !generating && summary?.status === 'COMPLETED' && playableQuizzes.length === 0 ? (
        <QuizEmptyState description="생성은 완료됐지만 표시할 문항이 없습니다." />
      ) : null}

      {satisfactionVisible ? (
        <SatisfactionSticky
          rating={satisfactionRating}
          comment={satisfactionComment}
          submitting={submitSatisfaction.isPending}
          onRating={setSatisfactionRating}
          onComment={setSatisfactionComment}
          onSubmit={onSubmitSatisfaction}
          onDismiss={dismissSatisfaction}
        />
      ) : null}
    </div>
  );
}
