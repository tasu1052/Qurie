import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../ds';
import { getPastQuizSetsMock } from '../../mocks/pastLearning';
import { PastQuizShell } from './pastQuizShell';
import { usePastQuizBasePath, type PastQuizBasePath } from './pastQuizPaths';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR');
}

type PastQuizListPageProps = {
  basePath?: PastQuizBasePath;
};

export default function PastQuizListPage({ basePath: basePathProp }: PastQuizListPageProps) {
  const navigate = useNavigate();
  const basePath = usePastQuizBasePath(basePathProp);
  const quizSets = getPastQuizSetsMock();

  return (
    <PastQuizShell basePath={basePath} breadcrumbs={['지난 퀴즈']}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>지난 퀴즈</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          종료된 세션의 퀴즈 세트를 다시 열람하거나 오답을 복습할 수 있어요.
        </span>
      </div>

      {quizSets.length === 0 ? (
        <EmptyState
          message="지난 퀴즈가 없습니다"
          description="세션이 종료되고 퀴즈가 발급되면 여기에서 확인할 수 있어요."
          actionLabel={basePath === '/manager' ? '세션 목록' : '대시보드'}
          onAction={() => navigate(basePath === '/manager' ? '/manager/sessions' : '/app')}
        />
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
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 40px',
              padding: '10px 24px',
              borderBottom: '1px solid var(--divider)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            <span>세션</span>
            <span>점수</span>
            <span>일자</span>
            <span />
          </div>
          {quizSets.map((q) => (
            <button
              key={q.quizSetId}
              type="button"
              onClick={() => navigate(`${basePath}/quizzes/${q.quizSetId}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 40px',
                padding: '13px 24px',
                border: 'none',
                borderBottom: '1px solid var(--divider)',
                background: 'transparent',
                fontSize: 13,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                color: 'inherit',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>
                {q.sessionTitle}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                {q.scoreCorrect}/{q.scoreTotal}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{formatDate(q.endedAt)}</span>
              <span style={{ display: 'inline-flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                <ChevronRight size={16} strokeWidth={1.75} />
              </span>
            </button>
          ))}
        </div>
      )}
    </PastQuizShell>
  );
}
