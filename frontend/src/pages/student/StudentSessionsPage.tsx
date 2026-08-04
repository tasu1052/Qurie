import { useNavigate } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { Badge, Button } from '../../ds';
import { getPastSessionsMock } from '../../mocks/pastLearning';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function StudentSessionsPage() {
  const navigate = useNavigate();
  const sessions = getPastSessionsMock();

  return (
    <StudentShell activeKey="sessions" breadcrumbs={['세션']}>
      <PageMain>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>세션</h1>
            <Badge status="neutral">데모 · AI 연동 예정</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            종료된 세션 기록입니다. AI 요약은 시연용 목업이며 실제 연동 전까지 참고용으로만 표시돼요.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => (
            <div
              key={s.sessionId}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.endedAt)}</span>
                </div>
                <Badge status="accent">
                  {s.scoreCorrect}/{s.scoreTotal} 정답
                </Badge>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {s.aiSummary}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/session/${s.sessionId}/report`)}
                >
                  상세
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/app/quizzes/${s.quizSetId}`)}
                >
                  퀴즈 열람
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PageMain>
    </StudentShell>
  );
}
