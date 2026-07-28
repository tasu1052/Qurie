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

export type TrackListItem = {
  id: string;
  name: string;
  tech: 'java' | 'python' | 'database';
  techLabel: string;
  status: 'active' | 'scheduled' | 'ended';
  statusLabel: string;
  description: string;
  classCount: number;
  studentCount: number;
  sessionCount: number;
  progress: number;
};

export type TrackDetailClass = {
  id: string;
  name: string;
  manager: string;
  students: number;
  sessions: number;
  quizRate: string;
  accuracy: string;
  accuracyAccent?: boolean;
  status: 'active' | 'ended';
  statusLabel: string;
};

export type TrackAlert = {
  id: string;
  className: string;
  severity: 'warning' | 'error';
  label: string;
  body: string;
  classId: string;
};

export type TrackManager = {
  id: string;
  initial: string;
  name: string;
  detail: string;
  avatarTone: 'accent' | 'muted';
};

export type ClassCard = {
  id: string;
  trackLabel: string;
  name: string;
  period: string;
  description: string;
  students: number;
  sessions: number;
  groups: number;
  progress: number;
  status: 'active' | 'scheduled' | 'ended';
  statusLabel: string;
  mutedTrack?: boolean;
};

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  initial: string;
  systemRole: 'MASTER' | 'MANAGER' | 'STUDENT';
  inviteStatus: 'ACCEPTED' | 'PENDING' | 'EXPIRED' | null;
  accountStatus: 'active' | 'inactive' | null;
  lastSeen: string;
  dimmed?: boolean;
};

export type PendingInvite = {
  id: string;
  email: string;
  meta: string;
  status: 'PENDING' | 'EXPIRED' | 'ACCEPTED';
  cooldownSec: number;
};

export type NoticeItem = {
  id: string;
  pinned?: boolean;
  scope: '전체' | '트랙' | '클래스';
  scopeLabel: string;
  date: string;
  title: string;
  body: string;
  author: string;
  views: number;
};

export type AnalyticsClassSummary = {
  id: string;
  name: string;
  sessions: number;
  completion: string;
  accuracy: string;
  accuracyAccent?: boolean;
  rating: string;
  trend: string;
  trendTone: 'success' | 'error' | 'muted';
  ended?: boolean;
};

export type SessionSummaryRow = {
  id: string;
  session: string;
  completion: string;
  accuracy: string;
  accuracyAccent?: boolean;
  activity: string;
  activityTone?: 'ink' | 'warning' | 'error';
  rating: string;
};

/* ——— Master dashboard ——— */

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

/* ——— Track list / detail ——— */

export const trackListItems: TrackListItem[] = [
  {
    id: 'java-major',
    name: 'Java 전공 (서울)',
    tech: 'java',
    techLabel: 'Java',
    status: 'active',
    statusLabel: '진행 중',
    description: 'Java · Spring 기반 웹 풀스택. 4개 클래스가 이 커리큘럼을 공유합니다.',
    classCount: 3,
    studentCount: 128,
    sessionCount: 24,
    progress: 58,
  },
  {
    id: 'python-nonmajor',
    name: 'Python 비전공 (서울)',
    tech: 'python',
    techLabel: 'Python',
    status: 'active',
    statusLabel: '진행 중',
    description: '비전공자 대상 Python 기초 · 웹 서비스 구현 과정.',
    classCount: 2,
    studentCount: 61,
    sessionCount: 12,
    progress: 34,
  },
  {
    id: 'java-nonmajor',
    name: 'Java 비전공 (서울)',
    tech: 'java',
    techLabel: 'Java',
    status: 'active',
    statusLabel: '진행 중',
    description: 'Java 웹 개발 입문. 짧은 사이클로 운영되는 단기 과정.',
    classCount: 1,
    studentCount: 14,
    sessionCount: 5,
    progress: 41,
  },
  {
    id: 'data-analysis',
    name: '데이터분석 (서울)',
    tech: 'database',
    techLabel: 'Database',
    status: 'scheduled',
    statusLabel: '예정',
    description: '데이터 수집 · 분석 · 시각화 실습. 커리큘럼 구성 중입니다.',
    classCount: 1,
    studentCount: 22,
    sessionCount: 0,
    progress: 0,
  },
];

export const trackDetailMeta = {
  id: 'java-major',
  name: 'Java 전공 (서울)',
  tech: 'java' as const,
  statusLabel: '진행 중',
  subtitle: '클래스 2개 운영 · 담당 매니저 5명 · 학생 86명 · 2025.11 트랙 개설',
};

export const trackDetailKpis: KpiItem[] = [
  { label: '운영 클래스', value: '2', caption: '서울 1반 · 서울 2반' },
  { label: '트랙 학생', value: '86', delta: '+4', deltaDirection: 'up', caption: '이번 달' },
  { label: '퀴즈 참여도', value: '86%', delta: '+2.4%', deltaDirection: 'up', caption: '최근 8주', accent: true },
  { label: '세션 액티비티', value: '74%', delta: '-3%', deltaDirection: 'down', caption: '주간 참여율 평균' },
];

export const trackDetailClasses: TrackDetailClass[] = [
  {
    id: 'seoul-1',
    name: '서울 1반',
    manager: '김지원 외 2',
    students: 45,
    sessions: 12,
    quizRate: '92%',
    accuracy: '88%',
    accuracyAccent: true,
    status: 'active',
    statusLabel: '진행 중',
  },
  {
    id: 'seoul-2',
    name: '서울 2반',
    manager: '박민수 외 1',
    students: 41,
    sessions: 24,
    quizRate: '98%',
    accuracy: '84%',
    status: 'ended',
    statusLabel: '종료',
  },
];

export const trackDetailAlerts: TrackAlert[] = [
  {
    id: 'a1',
    className: '서울 1반',
    severity: 'warning',
    label: '퀴즈 참여도 저조',
    body: '그룹 C의 최근 3개 세션 퀴즈 참여율이 61%로 클래스 평균(92%) 대비 크게 낮습니다.',
    classId: 'seoul-1',
  },
  {
    id: 'a2',
    className: '서울 1반',
    severity: 'error',
    label: '세션 액티비티 하락',
    body: '주간 세션 접속률이 2주 연속 하락했습니다 (82% → 74%). 세션 일정 조정을 검토하세요.',
    classId: 'seoul-1',
  },
];

export const trackDetailManagers: TrackManager[] = [
  {
    id: 'tm1',
    initial: '지',
    name: '김지원',
    detail: '서울 1반 ADMIN · 이번 주 세션 4회',
    avatarTone: 'accent',
  },
  {
    id: 'tm2',
    initial: '민',
    name: '박민수',
    detail: '서울 1반 STUDENT · 이번 주 세션 1회',
    avatarTone: 'muted',
  },
];

export const trackChartLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
export const trackChartSeries = [
  { name: '서울 1반', values: [78, 82, 85, 88, 90, 91, 92, 92], accent: true },
  { name: '서울 2반', values: [88, 90, 92, 94, 95, 96, 97, 98] },
];

/* ——— Class management ——— */

export const classCards: ClassCard[] = [
  {
    id: 'seoul-1',
    trackLabel: 'Java 전공 (서울)',
    name: '서울 1반',
    period: '2026.05.04 – 2026.09.25 · D-65',
    description: 'Java · Spring 기반 웹 풀스택 과정. 주 2회 라이브 세션 운영.',
    students: 45,
    sessions: 12,
    groups: 6,
    progress: 58,
    status: 'active',
    statusLabel: '진행 중',
  },
  {
    id: 'seoul-3',
    trackLabel: 'Python 비전공 (서울)',
    name: '서울 3반',
    period: '2026.06.01 – 2026.10.30 · D-100',
    description: 'Python 기초부터 웹 서비스 구현까지, 비전공자 맞춤 과정.',
    students: 38,
    sessions: 8,
    groups: 5,
    progress: 34,
    status: 'active',
    statusLabel: '진행 중',
  },
  {
    id: 'seoul-4',
    trackLabel: 'Data Track',
    name: '서울 4반',
    period: '2026.08.10 – 2026.12.18 · 시작 전',
    description: '데이터 수집 · 분석 · 시각화 실습. 커리큘럼 구성 진행 중.',
    students: 22,
    sessions: 0,
    groups: 0,
    progress: 0,
    status: 'scheduled',
    statusLabel: '예정',
  },
  {
    id: 'seoul-5',
    trackLabel: 'Java 비전공 (서울)',
    name: '서울 5반',
    period: '2026.07.01 – 2026.08.29 · D-38',
    description: '비전공자 대상 Java 웹 개발 입문 과정.',
    students: 14,
    sessions: 5,
    groups: 3,
    progress: 41,
    status: 'active',
    statusLabel: '진행 중',
  },
  {
    id: 'seoul-2',
    trackLabel: 'Java 전공 (서울)',
    name: '서울 2반',
    period: '2025.11.03 – 2026.04.24 · 종료됨',
    description: '수료율 91% · 평균 정답률 84%로 종료된 기수입니다.',
    students: 41,
    sessions: 24,
    groups: 7,
    progress: 100,
    status: 'ended',
    statusLabel: '종료',
    mutedTrack: true,
  },
];

/* ——— Members ——— */

export const memberKpis: KpiItem[] = [
  { label: '전체 멤버', value: '48', caption: 'Master 2 · Manager 46' },
  { label: '응답 대기 초대', value: '5', caption: 'PENDING' },
  { label: '신규 합류 (이번 달)', value: '+3', delta: '+8%', deltaDirection: 'up', caption: '지난 달 대비' },
  { label: '비활성 계정', value: '2', caption: '인사 조치 적용' },
];

export const memberRows: MemberRow[] = [
  {
    id: 'u1',
    name: '김마스터',
    email: 'master@ssafy.com',
    initial: '김',
    systemRole: 'MASTER',
    inviteStatus: null,
    accountStatus: 'active',
    lastSeen: '오늘 09:12',
  },
  {
    id: 'u2',
    name: '김지원',
    email: 'jiwon@ssafy.com',
    initial: '지',
    systemRole: 'MANAGER',
    inviteStatus: 'ACCEPTED',
    accountStatus: 'active',
    lastSeen: '오늘 08:47',
  },
  {
    id: 'u3',
    name: '박민수',
    email: 'minsu@ssafy.com',
    initial: '박',
    systemRole: 'MANAGER',
    inviteStatus: 'ACCEPTED',
    accountStatus: 'active',
    lastSeen: '어제 18:30',
  },
  {
    id: 'u4',
    name: '이하나',
    email: 'hana@ssafy.com',
    initial: '하',
    systemRole: 'MANAGER',
    inviteStatus: 'PENDING',
    accountStatus: null,
    lastSeen: '—',
  },
  {
    id: 'u5',
    name: '최원영',
    email: 'wonyoung@ssafy.com',
    initial: '최',
    systemRole: 'MANAGER',
    inviteStatus: 'EXPIRED',
    accountStatus: null,
    lastSeen: '—',
  },
  {
    id: 'u6',
    name: '정개발',
    email: 'gaebal@ssafy.com',
    initial: '정',
    systemRole: 'MANAGER',
    inviteStatus: 'ACCEPTED',
    accountStatus: 'inactive',
    lastSeen: '2026.04.12',
    dimmed: true,
  },
];

export const pendingInvites: PendingInvite[] = [
  {
    id: 'inv1',
    email: 'hana@ssafy.com',
    meta: 'MANAGER · 2026-07-25 발송 · 만료 D-1',
    status: 'PENDING',
    cooldownSec: 42,
  },
  {
    id: 'inv2',
    email: 'wonyoung@ssafy.com',
    meta: 'MANAGER · 2026-07-20 발송 · 만료됨',
    status: 'EXPIRED',
    cooldownSec: 0,
  },
];

/* ——— Announcements ——— */

export const notices: NoticeItem[] = [
  {
    id: 'n1',
    pinned: true,
    scope: '전체',
    scopeLabel: '전체',
    date: '2026.07.21',
    title: '8월 정기 점검 안내 — 세션 서비스 일시 중단',
    body: '8월 2일(일) 02:00–04:00 서버 점검이 진행됩니다. 해당 시간에는 세션 접속과 퀴즈 응시가 제한됩니다.',
    author: '김마스터',
    views: 44,
  },
  {
    id: 'n2',
    scope: '트랙',
    scopeLabel: '트랙 · FRONTEND',
    date: '2026.07.19',
    title: 'React 19 마이그레이션 세션 일정 변경',
    body: '7월 24일 예정이던 라이브 세션이 7월 26일 14:00로 변경되었습니다. 사전 과제는 동일합니다.',
    author: '김마스터',
    views: 31,
  },
  {
    id: 'n3',
    scope: '클래스',
    scopeLabel: '클래스 · 서울 1반',
    date: '2026.07.17',
    title: '중간 평가 리포트 발급 완료',
    body: '6월 세션 12건에 대한 리포트가 발급되었습니다. 마이페이지에서 확인 후 이의 신청은 7월 말까지 가능합니다.',
    author: '김지원',
    views: 45,
  },
  {
    id: 'n4',
    scope: '트랙',
    scopeLabel: '트랙 · BACKEND',
    date: '2026.07.15',
    title: 'BE 트랙 2기 코드 리뷰 컨벤션 업데이트',
    body: 'PR 리뷰 코멘트 작성 규칙이 개정되었습니다. 다음 세션부터 새 컨벤션이 적용됩니다.',
    author: '김마스터',
    views: 27,
  },
];

/* ——— Analytics ——— */

export const analyticsKpis: KpiItem[] = [
  { label: '퀴즈 완료율', value: '92%', delta: '+3.4%', deltaDirection: 'up', caption: '트랙 내 클래스 평균' },
  { label: '평균 정답률', value: '84%', delta: '+2.1%', deltaDirection: 'up', caption: '지난 기간 대비', accent: true },
  { label: '집계 세션 수', value: '24', caption: '최근 8주' },
  { label: '평균 평점', value: '4.2', delta: '-0.1', deltaDirection: 'down', caption: '5.0 만점' },
];

export const analyticsBarData = [
  { label: '서울 1반', value: 88, highlight: true },
  { label: '서울 3반', value: 81 },
  { label: '서울 5반', value: 76 },
  { label: '서울 2반', value: 84 },
];

export const analyticsClassSummaries: AnalyticsClassSummary[] = [
  { id: 'seoul-1', name: '서울 1반', sessions: 12, completion: '96%', accuracy: '88%', accuracyAccent: true, rating: '4.6', trend: '+6%', trendTone: 'success' },
  { id: 'seoul-3', name: '서울 3반', sessions: 8, completion: '91%', accuracy: '81%', rating: '4.2', trend: '+2%', trendTone: 'success' },
  { id: 'seoul-5', name: '서울 5반', sessions: 5, completion: '88%', accuracy: '76%', rating: '4.0', trend: '-3%', trendTone: 'error' },
  { id: 'seoul-2', name: '서울 2반', sessions: 24, completion: '98%', accuracy: '84%', rating: '4.4', trend: '—', trendTone: 'muted', ended: true },
];

export const classAnalyticsKpis: KpiItem[] = [
  { label: '정답률', value: '88%', delta: '+6%', deltaDirection: 'up', caption: '최근 8개 세션', accent: true },
  { label: '퀴즈 참여율', value: '96%', delta: '+2%', deltaDirection: 'up', caption: '최근 8개 세션' },
  { label: '세션 액티비티', value: '74%', delta: '-3%', deltaDirection: 'down', caption: '주간 접속률' },
  { label: '평균 평점', value: '4.6', delta: '+0.2', deltaDirection: 'up', caption: '5.0 만점' },
];

export const classAnalyticsLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
export const classAnalyticsSeries = [
  { name: '정답률', values: [74, 78, 82, 80, 85, 86, 88, 88], accent: true },
  { name: '퀴즈 참여율', values: [90, 92, 94, 93, 95, 96, 96, 96] },
];

export const categoryBarData = [
  { label: 'Hooks', value: 92, highlight: true },
  { label: 'State', value: 85 },
  { label: 'Suspense', value: 82 },
  { label: 'Test', value: 74 },
];

export const classSessionSummaries: SessionSummaryRow[] = [
  { id: 's1', session: 'react-hooks-deep-dive', completion: '100%', accuracy: '92%', accuracyAccent: true, activity: '86%', rating: '4.8' },
  { id: 's2', session: 'state-management', completion: '97%', accuracy: '85%', activity: '81%', rating: '4.4' },
  { id: 's3', session: 'suspense-patterns', completion: '90%', accuracy: '82%', activity: '68%', activityTone: 'warning', rating: '4.2' },
  { id: 's4', session: 'component-testing', completion: '94%', accuracy: '74%', activity: '61%', activityTone: 'error', rating: '3.9' },
];

/* ——— Manager ——— */

export const managerClassHeader = {
  track: 'Java 전공 (서울)',
  name: '서울 1반',
  statusLabel: '진행 중',
  period: '2026.05.04 – 2026.09.25 · D-65',
  progress: 58,
};

export const managerKpis: KpiItem[] = [
  { label: '학생', value: '45', caption: 'ADMIN 2 · STUDENT 43' },
  { label: '오늘 세션', value: '2', caption: 'LIVE 1 · 예정 1' },
  { label: '퀴즈 완료율', value: '96%', delta: '+2%', deltaDirection: 'up', caption: '이번 주' },
  { label: '평균 정답률', value: '88%', delta: '+6%', deltaDirection: 'up', caption: '최근 8세션', accent: true },
];

export const managerTodaySessions = [
  { id: 'ms1', title: 'react-hooks-deep-dive', status: 'LIVE' as const, time: '14:00–16:00', participants: '38/45', action: '입장' },
  { id: 'ms2', title: 'suspense-patterns', status: '예정' as const, time: '19:00–21:00', participants: '—', action: '닫기' },
  { id: 'ms3', title: 'state-management', status: '종료' as const, time: '어제 14:00', participants: '41/45', action: '리포트' },
];

export const managerTopStudents = [
  { id: 'st1', name: '이수진', completion: '98%', group: '그룹 A' },
  { id: 'st2', name: '최민호', completion: '95%', group: '그룹 B' },
  { id: 'st3', name: '강예린', completion: '93%', group: '그룹 A' },
  { id: 'st4', name: '한도윤', completion: '91%', group: '그룹 C' },
  { id: 'st5', name: '윤서아', completion: '89%', group: '그룹 B' },
];

export const managerAtRisk = [
  { id: 'ar1', name: '조현우', level: '위험' as const, reason: '최근 3세션 퀴즈 미응시' },
  { id: 'ar2', name: '배지훈', level: '주의' as const, reason: '정답률 58% · 평균 대비 -30%p' },
];

export type ClassRole = 'ADMIN' | 'STUDENT';

export const managerStudents = [
  { id: 's1', name: '김지원', email: 'jiwon@ssafy.com', role: 'ADMIN' as ClassRole, group: '—', completion: 100, activity: '활성' },
  { id: 's2', name: '박민수', email: 'minsu@ssafy.com', role: 'STUDENT' as ClassRole, group: '그룹 A', completion: 92, activity: '활성' },
  { id: 's3', name: '이수진', email: 'sujin@ssafy.com', role: 'STUDENT' as ClassRole, group: '그룹 A', completion: 98, activity: '활성' },
  { id: 's4', name: '조현우', email: 'hyunwoo@ssafy.com', role: 'STUDENT' as ClassRole, group: '그룹 C', completion: 42, activity: '저조' },
  { id: 's5', name: '배지훈', email: 'jihun@ssafy.com', role: 'STUDENT' as ClassRole, group: '그룹 C', completion: 58, activity: '주의' },
];

export const managerGroups = [
  { id: 'g1', name: '그룹 A', status: '활동', members: 7, leader: '이수진', period: '2026.05–09', sessions: 8 },
  { id: 'g2', name: '그룹 B', status: '활동', members: 8, leader: '최민호', period: '2026.05–09', sessions: 7 },
  { id: 'g3', name: '그룹 C', status: '활동', members: 7, leader: '한도윤', period: '2026.05–09', sessions: 6 },
  { id: 'g4', name: '그룹 D', status: '종료', members: 6, leader: '윤서아', period: '2026.05–06', sessions: 4 },
];

export const managerSessionList = [
  { id: 'sl1', slug: 'react-hooks-deep-dive', creator: '김지원', start: '2026.07.21 14:00', participants: '38/45', status: 'LIVE' },
  { id: 'sl2', slug: 'suspense-patterns', creator: '김지원', start: '2026.07.21 19:00', participants: '—', status: '예정' },
  { id: 'sl3', slug: 'state-management', creator: '김지원', start: '2026.07.20 14:00', participants: '41/45', status: '종료' },
  { id: 'sl4', slug: 'component-testing', creator: '박민수', start: '2026.07.18 14:00', participants: '39/45', status: '종료' },
  { id: 'sl5', slug: 'api-error-handling', creator: '김지원', start: '2026.07.15 14:00', participants: '40/45', status: '종료' },
];

export const studentOverview = {
  name: '박민수',
  email: 'minsu@ssafy.com',
  systemRole: 'STUDENT' as const,
  classRole: 'STUDENT' as ClassRole,
  group: '그룹 A',
  groupRole: 'LEADER' as const,
  kpis: [
    { label: '세션 참여', value: '11', caption: '최근 8주' },
    { label: '퀴즈 완료율', value: '92%', delta: '+4%', deltaDirection: 'up' as const, caption: '개인' },
    { label: '평균 정답률', value: '84%', delta: '+2%', deltaDirection: 'up' as const, caption: '개인', accent: true },
    { label: '평균 평점', value: '4.3', caption: '5.0 만점' },
  ] satisfies KpiItem[],
  difficulty: [
    { label: 'EASY', value: 40 },
    { label: 'NORMAL', value: 35, accent: true },
    { label: 'HARD', value: 25 },
  ],
  weeklyLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
  weeklySeries: [{ name: '정답률', values: [72, 75, 78, 80, 82, 81, 84, 84], accent: true }],
  sessions: [
    { id: 'so1', session: 'react-hooks-deep-dive', accuracy: '90%', completion: '100%', rating: '4.8' },
    { id: 'so2', session: 'state-management', accuracy: '82%', completion: '100%', rating: '4.2' },
    { id: 'so3', session: 'suspense-patterns', accuracy: '78%', completion: '90%', rating: '4.0' },
  ],
  comments: [
    { id: 'c1', author: '김지원', date: '2026.07.20', body: 'Hooks 세션에서 질문 퀄리티가 좋았습니다. 그룹 리딩도 안정적이에요.' },
  ],
};

/* ——— Student (Member) ——— */

export const studentDashKpis: KpiItem[] = [
  { label: '이번 주 세션', value: '3', caption: 'LIVE 1 · 예정 2' },
  { label: '퀴즈 완료', value: '18', delta: '+3', deltaDirection: 'up', caption: '이번 달' },
  { label: '평균 정답률', value: '84%', delta: '+2%', deltaDirection: 'up', caption: '개인', accent: true },
  { label: '주간 목표', value: '72%', caption: '4/5 세션' },
];

export const studentMySessions = [
  { id: 'ss1', title: 'react-hooks-deep-dive', status: 'LIVE' as const, time: '지금 · 서울 1반', action: '입장' },
  { id: 'ss2', title: 'suspense-patterns', status: '예정' as const, time: '오늘 19:00', action: '대기' },
  { id: 'ss3', title: 'state-management', status: '종료' as const, time: '어제 · 리포트 발급', action: '리포트' },
];

export const studentRecentGrades = [
  { id: 'rg1', session: 'state-management', score: '82%', date: '2026.07.20' },
  { id: 'rg2', session: 'suspense-patterns', score: '78%', date: '2026.07.18' },
  { id: 'rg3', session: 'component-testing', score: '74%', date: '2026.07.15' },
];

export const studentReviews = [
  { id: 'rv1', title: 'Suspense 경계 패턴 복습', reason: '정답률 78%' },
  { id: 'rv2', title: 'Testing Library 쿼리 우선순위', reason: 'HARD 2문항 오답' },
];

export const classLobby = {
  name: '서울 1반',
  track: 'Java 전공 (서울)',
  tech: 'java' as const,
  statusLabel: 'LIVE',
  progress: 58,
  sessions: [
    { id: 'cl1', title: 'react-hooks-deep-dive', date: '2026.07.21', status: 'LIVE' },
    { id: 'cl2', title: 'state-management', date: '2026.07.20', status: '종료' },
    { id: 'cl3', title: 'suspense-patterns', date: '2026.07.18', status: '종료' },
  ],
  materials: [
    { id: 'm1', title: 'Hooks 치트시트.pdf', size: '1.2MB' },
    { id: 'm2', title: '세션 템플릿.zip', size: '840KB' },
    { id: 'm3', title: '코딩 컨벤션.md', size: '12KB' },
  ],
  group: { name: '그룹 A', role: 'LEADER' as const, members: ['박', '수', '민', '호'] },
  notices: [
    { id: 'ln1', title: '중간 평가 리포트 발급 완료', date: '2026.07.17' },
    { id: 'ln2', title: '8월 정기 점검 안내', date: '2026.07.21' },
  ],
};

export const myPageProfile = {
  name: '박민수',
  email: 'minsu@ssafy.com',
  systemRole: 'STUDENT' as const,
  classRole: 'STUDENT' as ClassRole,
  className: '서울 1반',
  kpis: [
    { label: '참여 세션', value: '24', caption: '누적' },
    { label: '퀴즈 완료', value: '86', caption: '누적' },
    { label: '평균 정답률', value: '84%', accent: true, caption: '전체' },
    { label: '평균 평점', value: '4.3', caption: '5.0 만점' },
  ] satisfies KpiItem[],
};

export const finalReport = {
  name: '박민수',
  className: '서울 1반',
  kpis: [
    { label: '종합 정답률', value: '84%', delta: '+2%', deltaDirection: 'up' as const, caption: '전체 세션', accent: true },
    { label: '퀴즈 완료율', value: '92%', caption: '개인' },
    { label: '세션 참여', value: '11', caption: '최근 8주' },
    { label: '누적 평점', value: '4.3', caption: '5.0 만점' },
  ] satisfies KpiItem[],
  lineLabels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
  lineSeries: [{ name: '세션 정답률', values: [72, 75, 78, 80, 82, 81, 84, 84], accent: true }],
  difficulty: [
    { label: 'EASY', value: 40 },
    { label: 'NORMAL', value: 35, accent: true },
    { label: 'HARD', value: 25 },
  ],
  categories: [
    { label: 'Hooks', value: 90, highlight: true },
    { label: 'State', value: 82 },
    { label: 'Suspense', value: 78 },
    { label: 'Test', value: 74 },
  ],
  comment: '꾸준한 참여와 그룹 리딩이 돋보입니다. Suspense·Testing 영역을 보강하면 더 좋아질 거예요.',
  sessions: [
    { id: 'fr1', session: 'react-hooks-deep-dive', accuracy: '90%', rating: '4.8', date: '2026.07.21' },
    { id: 'fr2', session: 'state-management', accuracy: '82%', rating: '4.2', date: '2026.07.20' },
    { id: 'fr3', session: 'suspense-patterns', accuracy: '78%', rating: '4.0', date: '2026.07.18' },
  ],
};
