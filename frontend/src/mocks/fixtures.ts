export type RowStatus = 'loading' | 'error' | 'empty' | 'ready';

export type KpiItem = {
  label: string;
  value: string;
  delta?: string | null;
  deltaDirection?: 'up' | 'down' | null;
  caption?: string;
  accent?: boolean;
};

export type TrackCard = {
  id: string;
  name: string;
  tech: 'java' | 'python' | 'database';
  status: 'active' | 'scheduled';
  statusLabel: string;
  meta: string;
  metricValue: string;
  metricLabel: string;
  accentMetric?: boolean;
};

export type ManagerActivity = {
  id: string;
  initial: string;
  name: string;
  track: string;
  detail: string;
  tone: 'success' | 'warning';
  avatarTone: 'accent' | 'muted' | 'warning';
};

export type HrAlert = {
  lowParticipationCount: number;
  body: string;
};

export type ReportRow = {
  id: string;
  session: string;
  className: string;
  manager: string;
  quizRate: string;
  quizTone: 'accent' | 'ink' | 'error';
  rating: string;
  issuedAt: string;
};

export const masterKpis: KpiItem[] = [
  {
    label: '운영 트랙',
    value: '4',
    caption: 'Java 전공 · 비전공 · Python · 데이터분석',
  },
  {
    label: '활성 매니저',
    value: '12',
    delta: '+2',
    deltaDirection: 'up',
    caption: '이번 주 세션 운영 기준',
  },
  {
    label: '활성 세션',
    value: '3',
    caption: 'LIVE · 현재 접속 41명',
  },
  {
    label: '퀴즈 평균 정답률',
    value: '87%',
    delta: '+2.1%',
    deltaDirection: 'up',
    caption: '지난 주 대비',
    accent: true,
  },
];

export const masterTracks: TrackCard[] = [
  {
    id: 'java-major',
    name: 'Java 전공 (서울)',
    tech: 'java',
    status: 'active',
    statusLabel: '진행 중',
    meta: '클래스 2 · 매니저 5 · 학생 86 · 이번 주 세션 9회',
    metricValue: '86%',
    metricLabel: '참여도',
    accentMetric: true,
  },
  {
    id: 'python-nonmajor',
    name: 'Python 비전공 (서울)',
    tech: 'python',
    status: 'active',
    statusLabel: '진행 중',
    meta: '클래스 1 · 매니저 4 · 학생 38 · 이번 주 세션 5회',
    metricValue: '81%',
    metricLabel: '참여도',
  },
  {
    id: 'java-nonmajor',
    name: 'Java 비전공 (서울)',
    tech: 'java',
    status: 'active',
    statusLabel: '진행 중',
    meta: '클래스 1 · 매니저 3 · 학생 29 · 이번 주 세션 4회',
    metricValue: '79%',
    metricLabel: '평균 정답률',
  },
  {
    id: 'data-analysis',
    name: '데이터분석 (서울)',
    tech: 'database',
    status: 'scheduled',
    statusLabel: '예정',
    meta: '클래스 1 · 매니저 3 · 학생 22 · 08.10 시작',
    metricValue: '—',
    metricLabel: '시작 전',
  },
];

export const masterManagers: ManagerActivity[] = [
  {
    id: 'm1',
    initial: '지',
    name: '김지원',
    track: 'Java 전공',
    detail: '이번 주 세션 4회 · 리포트 6건 발급',
    tone: 'success',
    avatarTone: 'accent',
  },
  {
    id: 'm2',
    initial: '민',
    name: '박민수',
    track: 'Python 비전공',
    detail: '이번 주 세션 2회 · 리포트 3건 발급',
    tone: 'success',
    avatarTone: 'muted',
  },
  {
    id: 'm3',
    initial: '하',
    name: '이하나',
    track: '데이터분석',
    detail: '최근 14일 세션 운영 없음',
    tone: 'warning',
    avatarTone: 'warning',
  },
];

export const masterHrAlert: HrAlert = {
  lowParticipationCount: 2,
  body: '최근 30일간 세션 참여율이 20% 미만인 매니저가 2명 있습니다. 리포트 평점을 확인하고 조치를 검토하세요.',
};

export const masterReports: ReportRow[] = [
  {
    id: 'r1',
    session: 'react-hooks-deep-dive',
    className: '서울 1반',
    manager: '김지원',
    quizRate: '92%',
    quizTone: 'accent',
    rating: '4.8',
    issuedAt: '2026.07.21',
  },
  {
    id: 'r2',
    session: 'api-error-handling',
    className: 'BE 트랙 2기',
    manager: '박민수',
    quizRate: '78%',
    quizTone: 'ink',
    rating: '4.1',
    issuedAt: '2026.07.20',
  },
  {
    id: 'r3',
    session: 'sql-index-tuning',
    className: '데이터 1기',
    manager: '이하나',
    quizRate: '54%',
    quizTone: 'error',
    rating: '3.2',
    issuedAt: '2026.07.19',
  },
];
