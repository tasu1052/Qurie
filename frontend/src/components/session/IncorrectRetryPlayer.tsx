import { useState } from 'react';
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { Badge, Button } from '../../ds';

export type IncorrectRetryQuestion = {
  id: number;
  orderNo: number;
  question: string;
  choices: { idx: number; content: string }[];
  correctChoiceIdx: number;
  explanation: string | null;
};

type IncorrectRetryPlayerProps = {
  questions: IncorrectRetryQuestion[];
  onExit: () => void;
};

/**
 * 오답 다시 풀기 — 로컬 채점만 하며 quiz_progress / 리포트에 쓰지 않는다.
 */
export function IncorrectRetryPlayer({ questions, onExit }: IncorrectRetryPlayerProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div
        style={{
          marginTop: 12,
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>다시 풀 오답이 없어요</span>
        <Button variant="ghost" size="sm" onClick={onExit}>
          돌아가기
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div
        style={{
          marginTop: 12,
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-sunken)',
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>연습 완료</span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          연습 정답 {practiceCorrect}/{questions.length}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.45 }}>
          연습 결과는 리포트·응시 기록에 반영되지 않습니다.
        </span>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setPracticeCorrect(0);
              setFinished(false);
            }}
          >
            처음부터 다시
          </Button>
          <Button variant="primary" size="sm" onClick={onExit}>
            나가기
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[Math.min(index, questions.length - 1)];
  const revealed = picked != null;
  const isCorrect = revealed && picked === q.correctChoiceIdx;

  const goNext = () => {
    if (index >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <div
      style={{
        marginTop: 12,
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 280,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Badge status="warning">오답 연습</Badge>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {index + 1}/{questions.length}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          종료
        </Button>
      </div>

      <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        연습 모드 · 리포트에 반영되지 않습니다
      </span>

      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)' }}>
        Q{q.orderNo}. {q.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.choices.map((c) => {
          const selected = picked === c.idx;
          const showCorrect = revealed && c.idx === q.correctChoiceIdx;
          const showWrong = revealed && selected && c.idx !== q.correctChoiceIdx;
          let border = 'var(--border)';
          let background = 'var(--surface-sunken)';
          if (showCorrect) {
            border = 'var(--status-success)';
            background = 'var(--status-success-bg)';
          } else if (showWrong) {
            border = 'var(--status-error)';
            background = 'var(--status-error-bg)';
          } else if (selected) {
            border = 'var(--accent)';
            background = 'var(--accent-softer)';
          }

          return (
            <button
              key={c.idx}
              type="button"
              disabled={revealed}
              onClick={() => {
                setPicked(c.idx);
                if (c.idx === q.correctChoiceIdx) {
                  setPracticeCorrect((n) => n + 1);
                }
              }}
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
                textAlign: 'left',
                cursor: revealed ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {showCorrect ? (
                <CheckCircle2 size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              ) : showWrong ? (
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
                  {c.idx + 1}
                </span>
              )}
              <span>{c.content}</span>
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isCorrect ? 'var(--status-success)' : 'var(--status-error)',
            }}
          >
            {isCorrect ? '정답이에요' : '아쉽지만 오답이에요'}
          </span>
          {q.explanation?.trim() ? (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {q.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <Button
          variant="primary"
          size="sm"
          icon={<ChevronRight size={14} />}
          disabled={!revealed}
          onClick={goNext}
        >
          {index >= questions.length - 1 ? '결과 보기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
