import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { BookOpen, Settings, TriangleAlert } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import {
  AlertBanner,
  Badge,
  Button,
  ChartLegend,
  EmptyState,
  Input,
  LineChart,
  Modal,
  RowErrorFallback,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import javaTech from '../../ds/assets/tech/java_100.png';
import pythonTech from '../../ds/assets/tech/python_100.png';
import dbTech from '../../ds/assets/tech/database_100.png';
import { getClassAnalytics } from '../../network/analytics/analytics-apis';
import { getClassMembers } from '../../network/class/class-apis';
import { queryKeys } from '../../network/core/queryKeys';
import {
  QueryAsyncBoundary,
  useDeleteTrack,
  useGetClasses,
  useGetTrack,
  useUpdateTrack,
  type ClassResponse,
} from '../../data';

const techImg: Record<string, string> = { java: javaTech, python: pythonTech, database: dbTech };

const metricChips = [
  { key: 'accuracy' as const, label: '정답률' },
  { key: 'completion' as const, label: '완료율' },
];

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function normalizeTech(tech: string | null): 'java' | 'python' | 'database' | 'other' {
  const t = (tech ?? '').toLowerCase();
  if (t.includes('java')) return 'java';
  if (t.includes('python')) return 'python';
  if (t.includes('data') || t.includes('db')) return 'database';
  return 'other';
}

function classStatus(endedAt: string | null): { active: boolean; label: string } {
  if (endedAt && new Date(endedAt).getTime() < Date.now()) {
    return { active: false, label: '종료' };
  }
  return { active: true, label: '운영' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function toPct(value: number | null): number | null {
  if (value == null) return null;
  return value <= 1 ? value * 100 : value;
}

type ClassAlert = {
  id: string;
  classId: number;
  className: string;
  severity: 'warning' | 'error';
  label: string;
  body: string;
};

function deriveAlerts(classes: ClassResponse[]): ClassAlert[] {
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  const alerts: ClassAlert[] = [];

  for (const cls of classes) {
    if (cls.endedAt) {
      const end = new Date(cls.endedAt).getTime();
      if (end < now) {
        alerts.push({
          id: `${cls.id}-ended`,
          classId: cls.id,
          className: cls.name,
          severity: 'error',
          label: '종료됨',
          body: `${formatDate(cls.endedAt)}에 종료된 클래스입니다. 후속 조치가 필요하면 클래스 설정을 확인하세요.`,
        });
      } else if (end - now <= fourteenDays) {
        const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
        alerts.push({
          id: `${cls.id}-ending`,
          classId: cls.id,
          className: cls.name,
          severity: 'warning',
          label: '곧 종료',
          body: `종료일 ${formatDate(cls.endedAt)}까지 ${daysLeft}일 남았습니다. 일정·마감 안내를 검토하세요.`,
        });
      }
    }
    if (cls.capacity === 0) {
      alerts.push({
        id: `${cls.id}-capacity`,
        classId: cls.id,
        className: cls.name,
        severity: 'warning',
        label: '정원 미설정',
        body: '정원이 0으로 설정되어 있습니다. 클래스 정원을 확인하세요.',
      });
    }
  }

  return alerts;
}

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={100} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--stat-card-padding)',
            }}
          >
            <Skeleton width="60%" height={14} delay={i * 0.08} />
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

function TrackDetailBody({ trackId }: { trackId: number }) {
  const navigate = useNavigate();
  const { data: track } = useGetTrack(trackId);
  const { data: classesPage } = useGetClasses({ trackId, size: 100, sort: 'name,asc' });
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();

  const classes = classesPage.data;
  const classIds = useMemo(() => classes.map((c) => c.id), [classes]);

  const memberQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: queryKeys.classes.members(classId, { size: 50, role: 'MANAGER' }),
      queryFn: () => getClassMembers(classId, { size: 50, role: 'MANAGER' }),
    })),
  });

  const analyticsQueries = useQueries({
    queries: classIds.map((classId) => ({
      queryKey: queryKeys.analytics.classDetail(classId),
      queryFn: () => getClassAnalytics(classId),
    })),
  });

  const [metric, setMetric] = useState<(typeof metricChips)[number]['key']>('accuracy');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(track.name);
  const [desc, setDesc] = useState(track.description ?? '');
  const [tech, setTech] = useState(track.tech ?? 'java');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const trackManagers = useMemo(() => {
    const byId = new Map<number, { userId: number; name: string; email: string }>();
    for (const q of memberQueries) {
      for (const m of q.data?.data ?? []) {
        if (!byId.has(m.userId)) {
          byId.set(m.userId, { userId: m.userId, name: m.name, email: m.email });
        }
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [memberQueries]);

  const techKey = normalizeTech(track.tech);
  const techImage = techImg[techKey];
  const managerCount = trackManagers.length;
  const activeClassCount = classes.filter((c) => classStatus(c.endedAt).active).length;
  const trackStatusLabel =
    classes.length === 0 ? '대기' : activeClassCount > 0 ? '진행 중' : '종료';
  const alerts = useMemo(() => deriveAlerts(classes), [classes]);

  const totalStudents = useMemo(() => {
    let sum = 0;
    let hasAny = false;
    for (const q of analyticsQueries) {
      if (q.data) {
        sum += q.data.studentCount;
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  }, [analyticsQueries]);

  const openSettings = () => {
    setName(track.name);
    setDesc(track.description ?? '');
    setTech(track.tech ?? 'java');
    setSaveError(null);
    setSettingsOpen(true);
  };

  const onSave = () => {
    setSaveError(null);
    if (!name.trim()) {
      setSaveError('트랙 이름을 입력하세요.');
      return;
    }
    updateTrack.mutate(
      {
        trackId,
        name: name.trim(),
        description: desc.trim() || undefined,
        tech,
      },
      {
        onSuccess: () => setSettingsOpen(false),
        onError: (err) => setSaveError(apiErrorMessage(err, '트랙 저장에 실패했습니다.')),
      },
    );
  };

  const onConfirmDelete = () => {
    setDeleteError(null);
    deleteTrack.mutate(
      { trackId },
      {
        onSuccess: () => navigate('/master/tracks', { replace: true }),
        onError: (err) => setDeleteError(apiErrorMessage(err, '트랙 삭제에 실패했습니다.')),
      },
    );
  };

  const chartClasses = classes.slice(0, 5);
  const chartPoints = chartClasses
    .map((cls, i) => {
      const analytics = analyticsQueries[i]?.data;
      if (!analytics) return null;
      const raw = metric === 'accuracy' ? analytics.avgAccuracy : analytics.avgCompletionRate;
      const pct = toPct(raw);
      if (pct == null) return null;
      return { name: cls.name, value: Math.round(pct) };
    })
    .filter((p): p is { name: string; value: number } => p != null);

  const chartLabels = chartPoints.map((p) => p.name);
  const chartSeries =
    chartPoints.length > 0
      ? [{ name: metric === 'accuracy' ? '정답률' : '완료율', values: chartPoints.map((p) => p.value), accent: true }]
      : [];

  const managerInitial = (n: string) => (n.trim() ? n.trim()[0] : '?');

  return (
    <MasterShell activeKey="tracks" breadcrumbs={['SSAFY 서울캠퍼스', '트랙 관리', track.name]}>
      <PageMain>
        <div style={{ marginBottom: 8 }}>
          <Link
            to="/master/tracks"
            style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            ← 트랙 목록
          </Link>
        </div>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <span
          className="tech-icon-wrap"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'var(--surface-sunken)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {techImage ? (
            <img
              src={techImage}
              width={30}
              height={30}
              alt={track.tech ?? 'tech'}
              className="tech-icon"
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <BookOpen size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          )}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              Track
            </span>
            <Badge status={activeClassCount > 0 ? 'success' : 'neutral'}>{trackStatusLabel}</Badge>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{track.name}</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {track.description ||
              `클래스 ${classes.length}개 · 담당 매니저 ${managerCount}명 · ${formatDate(track.createdAt)} 개설`}
          </span>
        </div>
        <Button variant="secondary" icon={<Settings size={14} strokeWidth={1.75} />} onClick={openSettings}>
          트랙 설정
        </Button>
      </div>

      <StatCardRow>
        <StatCard
          label="운영 클래스"
          value={String(classes.length)}
          caption={classes.length > 0 ? classes.map((c) => c.name).slice(0, 3).join(' · ') : '등록된 클래스 없음'}
        />
        <StatCard label="담당 매니저" value={String(managerCount)} caption="MANAGER 역할" />
        <StatCard
          label="트랙 학생"
          value={totalStudents != null ? String(totalStudents) : '—'}
          caption={totalStudents != null ? '클래스 합산' : '집계 중'}
        />
        <StatCard
          label="활성 클래스"
          value={String(activeClassCount)}
          caption={`전체 ${classes.length}개 중`}
          accent={activeClassCount > 0}
        />
      </StatCardRow>

      <div className="qurie-app-split" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                클래스 현황
              </span>
              <Link to="/master/classes" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                클래스 관리 <span style={{ fontWeight: 800 }}>&gt;</span>
              </Link>
            </div>
            {classes.length === 0 ? (
              <p style={{ margin: '0 24px 20px', fontSize: 13, color: 'var(--text-muted)' }}>등록된 클래스가 없습니다.</p>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 0.6fr 0.7fr',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>클래스</span>
                  <span>담당 매니저</span>
                  <span>학생</span>
                  <span>상태</span>
                </div>
                {classes.map((c, i) => {
                  const { active, label } = classStatus(c.endedAt);
                  const memberQuery = memberQueries[i];
                  const analyticsQuery = analyticsQueries[i];
                  const managers = memberQuery?.data?.data ?? [];
                  const managerLabel =
                    memberQuery?.isPending
                      ? '…'
                      : managers.length === 0
                        ? '—'
                        : managers.length === 1
                          ? managers[0].name
                          : `${managers[0].name} 외 ${managers.length - 1}`;
                  const studentCount =
                    analyticsQuery?.isPending || !analyticsQuery?.data
                      ? '…'
                      : String(analyticsQuery.data.studentCount);

                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/master/classes/${c.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/master/classes/${c.id}`)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.6fr 1fr 0.6fr 0.7fr',
                        padding: '13px 24px',
                        borderBottom: '1px solid var(--divider)',
                        fontSize: 13,
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{managerLabel}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{studentCount}</span>
                      <Badge status={active ? 'success' : 'neutral'}>{label}</Badge>
                    </div>
                  );
                })}
              </>
            )}
          </div>

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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                클래스별 지표 추이
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>최대 5개 클래스 · 스냅샷 지표</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {metricChips.map((chip) => {
                const active = metric === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setMetric(chip.key)}
                    style={{
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                      background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            {chartSeries.length === 0 ? (
              <EmptyState
                message="표시할 지표가 없습니다"
                description="클래스 분석 데이터가 쌓이면 정답률·완료율을 비교할 수 있습니다."
              />
            ) : (
              <>
                <LineChart series={chartSeries} labels={chartLabels} height={180} />
                <ChartLegend items={chartSeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TriangleAlert size={16} strokeWidth={1.75} style={{ color: 'var(--status-warning)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>주의가 필요한 클래스</span>
            </div>
            {alerts.length === 0 ? (
              <div
                style={{
                  borderRadius: 12,
                  border: '1px dashed var(--border-strong)',
                  background: 'var(--surface-sunken)',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  확인할 항목 없음
                </span>
                <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-muted)' }}>
                  종료 임박·정원 미설정 등 주의가 필요한 클래스가 없습니다.
                </span>
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: `1px solid ${a.severity === 'warning' ? 'var(--status-warning-bg)' : 'var(--border)'}`,
                    background: a.severity === 'warning' ? 'var(--status-warning-bg)' : 'transparent',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.className}</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        fontWeight: 700,
                        color: a.severity === 'warning' ? 'var(--status-warning)' : 'var(--status-error)',
                      }}
                    >
                      {a.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{a.body}</span>
                  <Link
                    to={`/master/classes/${a.classId}`}
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    클래스 상세 보기 <span style={{ fontWeight: 800 }}>&gt;</span>
                  </Link>
                </div>
              ))
            )}
          </div>

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
              담당 매니저
            </span>
            {trackManagers.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>등록된 매니저가 없습니다.</p>
            ) : (
              trackManagers.map((m) => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {managerInitial(m.name)}
                  </span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={settingsOpen}
        title="트랙 설정"
        description="이름 · 기술 스택 · 설명을 수정하거나 트랙을 삭제할 수 있습니다."
        primaryLabel={updateTrack.isPending ? '저장 중…' : '저장하기'}
        secondaryLabel="취소"
        onPrimary={onSave}
        onSecondary={() => setSettingsOpen(false)}
        onClose={() => setSettingsOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {saveError ? <AlertBanner tone="error" title="저장 실패" description={saveError} /> : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>트랙 이름</span>
            <Input
              placeholder="예: Java 전공 (서울)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>기술 스택</span>
            <Select
              options={[
                { value: 'java', label: 'Java' },
                { value: 'python', label: 'Python' },
                { value: 'database', label: 'Database' },
              ]}
              value={tech}
              onChange={setTech}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>설명</span>
            <Input
              placeholder="커리큘럼 요약을 입력하세요"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              width="100%"
            />
          </label>
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 14, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
              트랙 삭제…
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteOverlay
        open={deleteOpen}
        title="트랙 삭제"
        description="트랙을 삭제하면 하위 클래스·세션·리포트가 함께 영향을 받습니다. 이 작업은 되돌릴 수 없습니다."
        confirmText={track.name}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <AlertBanner tone="error" title="삭제 실패" description={deleteError} /> : null}
      </PageMain>
    </MasterShell>
  );
}

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const trackId = Number(id);
  const [rowKey, setRowKey] = useState(0);

  if (!Number.isFinite(trackId) || trackId <= 0) {
    return <Navigate to="/master/tracks" replace />;
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<DetailSkeleton />}
      errorFallback={
        <RowErrorFallback
          onRetry={() => setRowKey((k) => k + 1)}
          title="트랙을 불러오지 못했습니다"
          description="상세 정보를 다시 불러와 주세요."
        />
      }
    >
      <TrackDetailBody trackId={trackId} />
    </QueryAsyncBoundary>
  );
}
