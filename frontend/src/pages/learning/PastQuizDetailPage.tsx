import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, EmptyState } from '../../ds';
import { getPastQuizSetMock, type PastQuizItem } from '../../mocks/pastLearning';
import { PastQuizShell } from './pastQuizShell';
import { usePastQuizBasePath, type PastQuizBasePath } from './pastQuizPaths';

type FilterKey = 'all' | 'correct' | 'wrong';
type ModeKey = 'view' | 'retry';

const filterChips: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'correct', label: '맞춘 문항' },
  { key: 'wrong', label: '틀린 문항' },
];

const modeChips: { key: ModeKey; label: string }[] = [
  { key: 'view', label: '열람' },
  { key: 'retry', label: '오답 재풀이' },
];

function filterItems(items: PastQuizItem[], filter: FilterKey): PastQuizItem[] {
  if (filter === 'correct') return items.filter((i) => i.isCorrect === true);
  if (filter === 'wrong') return items.filter((i) => i.isCorrect === false);
  return items;
}

function ChoiceRow({
  choice,
  correctIdx,
  userChoiceIdx,
  showResult,
}: {
  choice: { idx: number; content: string };
  correctIdx: number;
  userChoiceIdx: number | null;
  showResult: boolean;
}) {
  const isCorrect = choice.idx === correctIdx;
  const isUserPick = userChoiceIdx === choice.idx;
  let border = 'var(--border)';
  let background = 'var(--surface-sunken)';

  if (showResult) {
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
      }}
    >
      {showResult && isCorrect ? (
        <CheckCircle2 size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
      ) : showResult && isUserPick && !isCorrect ? (
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
      <span>{choice.content}</span>
    </div>
  );
}

function RetryQuestion({
  item,
  selectedIdx,
  submitted,
  onSelect,
  onSubmit,
}: {
  item: PastQuizItem;
  selectedIdx: number | null;
  submitted: boolean;
  onSelect: (idx: number) => void;
  onSubmit: () => void;
}) {
  const isCorrect = submitted && selectedIdx === item.correctIdx;

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
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
        Q{item.orderNo}
      </span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)' }}>
        {item.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {item.choices.map((c) => {
          const picked = selectedIdx === c.idx;
          const showAnswer = submitted;
          const isAnswer = c.idx === item.correctIdx;
          let border = picked ? 'var(--accent)' : 'var(--border)';
          let background = picked ? 'var(--accent-softer)' : 'var(--surface-sunken)';
          if (showAnswer && isAnswer) {
            border = 'var(--status-success)';
            background = 'var(--status-success-bg)';
          } else if (showAnswer && picked && !isAnswer) {
            border = 'var(--status-error)';
            background = 'var(--status-error-bg)';
          }
          return (
            <button
              key={c.idx}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(c.idx)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${border}`,
                background,
                fontSize: 13,
                cursor: submitted ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                color: 'var(--ink)',
              }}
            >
              {c.content}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button variant="secondary" size="sm" disabled={selectedIdx == null} onClick={onSubmit}>
          제출
        </Button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Badge status={isCorrect ? 'success' : 'error'}>
            {isCorrect ? '정답입니다' : '오답입니다'}
          </Badge>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            {item.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

type PastQuizDetailPageProps = {
  basePath?: PastQuizBasePath;
};

export default function PastQuizDetailPage({ basePath: basePathProp }: PastQuizDetailPageProps) {
  const navigate = useNavigate();
  const { quizSetId: quizSetIdParam } = useParams<{ quizSetId: string }>();
  const basePath = usePastQuizBasePath(basePathProp);
  const quizSetId = Number(quizSetIdParam);
  const quizSet = Number.isFinite(quizSetId) ? getPastQuizSetMock(quizSetId) : undefined;

  const [filter, setFilter] = useState<FilterKey>('all');
  const [mode, setMode] = useState<ModeKey>('view');
  const [retryAnswers, setRetryAnswers] = useState<Record<number, number | null>>({});
  const [retrySubmitted, setRetrySubmitted] = useState<Record<number, boolean>>({});

  const wrongItems = useMemo(
    () => (quizSet ? quizSet.items.filter((i) => i.isCorrect === false) : []),
    [quizSet],
  );

  const displayItems = useMemo(() => {
    if (!quizSet) return [];
    if (mode === 'retry') return wrongItems;
    return filterItems(quizSet.items, filter);
  }, [quizSet, mode, filter, wrongItems]);

  if (!quizSet) {
    return (
      <PastQuizShell basePath={basePath} breadcrumbs={['지난 퀴즈', '상세']}>
        <EmptyState
          message="퀴즈 세트를 찾을 수 없습니다"
          actionLabel="목록으로"
          onAction={() => navigate(`${basePath}/quizzes`)}
        />
      </PastQuizShell>
    );
  }

  return (
    <PastQuizShell basePath={basePath} breadcrumbs={['지난 퀴즈', quizSet.sessionTitle]}>
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(`${basePath}/quizzes`)}
        >
          목록으로
        </Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>{quizSet.sessionTitle}</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {quizSet.scoreCorrect}/{quizSet.scoreTotal} 정답 ·{' '}
          {new Date(quizSet.endedAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {modeChips.map((c) => {
          const active = mode === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setMode(c.key)}
              style={{
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {mode === 'view' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {filterChips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
                  background: active ? 'var(--surface-sunken)' : 'var(--surface-card)',
                  color: active ? 'var(--ink)' : 'var(--text-secondary)',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="qurie-master-split" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {mode === 'retry' && wrongItems.length === 0 ? (
            <EmptyState
              message="틀린 문항이 없습니다"
              description="모든 문항을 맞혔어요."
              actionLabel="열람으로 보기"
              onAction={() => setMode('view')}
            />
          ) : displayItems.length === 0 ? (
            <EmptyState
              message="표시할 문항이 없습니다"
              actionLabel="전체 보기"
              onAction={() => setFilter('all')}
            />
          ) : mode === 'view' ? (
            displayItems.map((item) => (
              <div
                key={item.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Q{item.orderNo}
                  </span>
                  {item.isCorrect === true ? (
                    <Badge status="success">정답</Badge>
                  ) : item.isCorrect === false ? (
                    <Badge status="error">오답</Badge>
                  ) : null}
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)' }}>
                  {item.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.choices.map((c) => (
                    <ChoiceRow
                      key={c.idx}
                      choice={c}
                      correctIdx={item.correctIdx}
                      userChoiceIdx={item.userChoiceIdx}
                      showResult
                    />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                  {item.explanation}
                </p>
              </div>
            ))
          ) : (
            displayItems.map((item) => (
              <RetryQuestion
                key={item.id}
                item={item}
                selectedIdx={retryAnswers[item.id] ?? null}
                submitted={retrySubmitted[item.id] ?? false}
                onSelect={(idx) =>
                  setRetryAnswers((prev) => ({ ...prev, [item.id]: idx }))
                }
                onSubmit={() =>
                  setRetrySubmitted((prev) => ({ ...prev, [item.id]: true }))
                }
              />
            ))
          )}
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
            position: 'sticky',
            top: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              AI 오답 유형 분석
            </span>
            <Badge status="neutral">데모 · AI 연동 예정</Badge>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {quizSet.wrongTypeTags.length === 0 ? (
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>오답 유형 없음</span>
            ) : (
              quizSet.wrongTypeTags.map((tag) => (
                <Badge key={tag} status="warning">
                  {tag}
                </Badge>
              ))
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {quizSet.aiWrongAnalysis}
          </p>
        </div>
      </div>
    </PastQuizShell>
  );
}
