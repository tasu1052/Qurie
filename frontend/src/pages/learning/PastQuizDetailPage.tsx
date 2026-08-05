import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, EmptyState, RowErrorFallback, Skeleton } from '../../ds';
import {
  QueryAsyncBoundary,
  useGetQuizProgress,
  useGetQuizSet,
  type QuizItem,
  type QuizProgressItem,
} from '../../data';
import { PastQuizShell } from './pastQuizShell';
import { SESSION_LIST_PAGE_TITLE, usePastQuizBasePath, type PastQuizBasePath } from './pastQuizPaths';


function correctChoiceIdx(item: QuizItem): number {
  return item.choices.find((c) => c.answer)?.idx ?? 0;
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
        width: '100%',
        boxSizing: 'border-box',
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

function QuestionCard({
  item,
  progress,
}: {
  item: QuizItem;
  progress?: QuizProgressItem;
}) {
  const correctIdx = correctChoiceIdx(item);
  const savedChoice = progress?.chosenChoiceIdx ?? null;
  const savedCorrect = progress?.isCorrect;
  const [pickedIdx, setPickedIdx] = useState<number | null>(savedChoice);
  const showResult = pickedIdx != null || savedChoice != null;
  const userChoiceIdx = pickedIdx ?? savedChoice;
  const isCorrect =
    savedCorrect != null ? savedCorrect : userChoiceIdx != null ? userChoiceIdx === correctIdx : null;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
          Q{item.orderNo}
        </span>
        {isCorrect === true ? <Badge status="success">정답</Badge> : null}
        {isCorrect === false ? <Badge status="error">오답</Badge> : null}
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)' }}>
        {item.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {item.choices.map((c) => (
          <button
            key={c.idx}
            type="button"
            disabled={showResult}
            onClick={() => setPickedIdx(c.idx)}
            style={{
              border: 'none',
              padding: 0,
              background: 'transparent',
              cursor: showResult ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
            }}
          >
            <ChoiceRow
              choice={c}
              correctIdx={correctIdx}
              userChoiceIdx={userChoiceIdx}
              showResult={showResult}
            />
          </button>
        ))}
      </div>
      {showResult && item.explanation ? (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
          {progress?.explanation?.trim() || item.explanation}
        </p>
      ) : null}
    </div>
  );
}

function QuizDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={180} radius={16} delay={i * 0.06} />
      ))}
    </div>
  );
}

function QuizDetailBody({ quizSetId, basePath }: { quizSetId: number; basePath: PastQuizBasePath }) {
  const navigate = useNavigate();
  const { data: quizSet } = useGetQuizSet(quizSetId);
  const { data: progressSummary } = useGetQuizProgress(quizSetId);

  const progressItems = progressSummary?.items ?? [];
  const progressByQuizId = useMemo(() => {
    const map = new Map<number, QuizProgressItem>();
    for (const item of progressItems) {
      map.set(item.quizId, item);
    }
    return map;
  }, [progressItems]);

  const items = useMemo(
    () => [...quizSet.quizzes].sort((a, b) => a.orderNo - b.orderNo),
    [quizSet.quizzes],
  );

  const displayItems = items;

  const correctCount = items.filter((item) => progressByQuizId.get(item.id)?.isCorrect === true).length;

  return (
    <>
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(`${basePath}/quizzes`)}
        >
          목록으로
        </Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>
          퀴즈 세트 #{quizSet.quizSetId}
        </h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {correctCount}/{items.length} 정답 · 상태 {quizSet.status}
        </span>
      </div>

      <div className="qurie-app-split" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {displayItems.length === 0 ? (
            <EmptyState
              message="표시할 문항이 없습니다"
              description="퀴즈 문항이 아직 생성되지 않았어요."
              actionLabel="목록으로"
              onAction={() => navigate(`${basePath}/quizzes`)}
            />
          ) : (
            displayItems.map((item) => (
              <QuestionCard key={item.id} item={item} progress={progressByQuizId.get(item.id)} />
            ))
          )}
        </div>
      </div>
    </>
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
  const validId = Number.isFinite(quizSetId) && quizSetId > 0;
  const [rowKey, setRowKey] = useState(0);

  if (!validId) {
    return (
      <PastQuizShell basePath={basePath} breadcrumbs={[SESSION_LIST_PAGE_TITLE, '상세']}>
        <EmptyState
          message="퀴즈 세트를 찾을 수 없습니다"
          actionLabel="목록으로"
          onAction={() => navigate(`${basePath}/quizzes`)}
        />
      </PastQuizShell>
    );
  }

  return (
    <PastQuizShell basePath={basePath} breadcrumbs={[SESSION_LIST_PAGE_TITLE, `퀴즈 #${quizSetId}`]}>
      <QueryAsyncBoundary
        key={rowKey}
        suspenseFallback={<QuizDetailSkeleton />}
        errorFallback={
          <RowErrorFallback
            onRetry={() => setRowKey((k) => k + 1)}
            title="퀴즈를 불러오지 못했습니다"
            description="GET /quiz/{quizSetId} 또는 progress API를 확인해 주세요."
          />
        }
      >
        <QuizDetailBody quizSetId={quizSetId} basePath={basePath} />
      </QueryAsyncBoundary>
    </PastQuizShell>
  );
}
