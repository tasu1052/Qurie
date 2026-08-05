export type ApiAvailability = 'ready' | 'missing';

export type ApiEndpointSpec = {
  id: string;
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Path relative to `/api/v1` (or axios base). */
  path: string;
  description?: string;
  backend: ApiAvailability;
  frontendHook: ApiAvailability;
  hookName?: string;
};

export type ApiIntegrationGroup = {
  id: string;
  title: string;
  description: string;
  endpoints: ApiEndpointSpec[];
};

export const API_INTEGRATION_GROUPS = {
  trackAnalytics: {
    id: 'trackAnalytics',
    title: '트랙 분석',
    description: '트랙 단위 KPI·추이·클래스 비교 차트',
    endpoints: [
      {
        id: 'track-analytics',
        label: '트랙 분석 상세',
        method: 'GET',
        path: '/analytics/tracks/{trackId}',
        description: '트랙 KPI, 주간 추이, 클래스별 비교',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
  classAnalyticsTrends: {
    id: 'classAnalyticsTrends',
    title: '클래스 분석 — 세션 추이',
    description: '클래스 요약 KPI는 연동됨. 세션 단위 추이·내보내기는 미구현',
    endpoints: [
      {
        id: 'class-analytics-summary',
        label: '클래스 분석 요약',
        method: 'GET',
        path: '/analytics/classes/{classId}',
        description: '학생·세션·정답률 등 집계 KPI',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetClassAnalytics',
      },
      {
        id: 'class-analytics-series',
        label: '클래스 세션 추이',
        method: 'GET',
        path: '/analytics/classes/{classId}/sessions',
        description: '세션별 정답률·참여율 시계열 (차트용)',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
  studentAnalytics: {
    id: 'studentAnalytics',
    title: '학생 개별 분석',
    description: '매니저 학생 상세의 KPI·차트·세션별 성과',
    endpoints: [
      {
        id: 'user-analytics',
        label: '학생 분석',
        method: 'GET',
        path: '/analytics/users/{userId}',
        description: 'KPI, 난이도 분포, 주간 추이, 세션별 성과',
        backend: 'missing',
        frontendHook: 'missing',
      },
      {
        id: 'user-profile',
        label: '학생 프로필',
        method: 'GET',
        path: '/users/{userId}',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetUserProfile',
      },
    ],
  },
  pastQuizBySession: {
    id: 'pastQuizBySession',
    title: '세션별 지난 퀴즈',
    description: '세션 목록에서 퀴즈 세트 ID·점수를 조회하는 API',
    endpoints: [
      {
        id: 'session-quiz-link',
        label: '세션 퀴즈 연결',
        method: 'GET',
        path: '/sessions/{sessionId}/report',
        description: '세션 리포트의 quizSetId로 퀴즈 열람 (리포트 발급 후)',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetSessionReport',
      },
      {
        id: 'session-quiz-list',
        label: '클래스 세션 퀴즈 목록',
        method: 'GET',
        path: '/sessions?classId=&includeQuizSummary=true',
        description: '목록 행에 퀴즈 점수·quizSetId 포함 (확장 필요)',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
  pastQuizReview: {
    id: 'pastQuizReview',
    title: '지난 퀴즈 상세',
    description: '퀴즈 문항·진행 결과 조회',
    endpoints: [
      {
        id: 'quiz-set',
        label: '퀴즈 세트',
        method: 'GET',
        path: '/quiz/{quizSetId}',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetQuizSet',
      },
      {
        id: 'quiz-progress',
        label: '퀴즈 진행·채점',
        method: 'GET',
        path: '/quiz/{quizSetId}/progress',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetQuizProgress',
      },
      {
        id: 'quiz-wrong-analysis',
        label: 'AI 오답 유형 분석',
        method: 'GET',
        path: '/quiz/{quizSetId}/wrong-analysis',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
  sessionReportAi: {
    id: 'sessionReportAi',
    title: '세션 리포트 AI 요약',
    description: '리포트 본문의 AI 코멘트·강점·개선점',
    endpoints: [
      {
        id: 'session-report',
        label: '세션 리포트',
        method: 'GET',
        path: '/sessions/{sessionId}/report?userId=',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetSessionReport',
      },
    ],
  },
  finalReportComments: {
    id: 'finalReportComments',
    title: '학기 리포트 코멘트',
    description: 'AI·강사 코멘트 블록',
    endpoints: [
      {
        id: 'user-report-summary',
        label: '학기 종합 리포트',
        method: 'GET',
        path: '/users/{userId}/report-summary?classId=',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetUserReport',
      },
      {
        id: 'user-report-ai-comment',
        label: '학기 AI 코멘트',
        method: 'GET',
        path: '/users/{userId}/report-summary/ai-comment',
        description: 'UserReportDetail에 aiComment 필드 확장 또는 별도 API',
        backend: 'missing',
        frontendHook: 'missing',
      },
      {
        id: 'student-comments',
        label: '강사 코멘트',
        method: 'GET',
        path: '/users/{userId}/comments?classId=',
        backend: 'ready',
        frontendHook: 'ready',
        hookName: 'useGetStudentComments',
      },
    ],
  },
  adminConsole: {
    id: 'adminConsole',
    title: '어드민 콘솔',
    description: 'Qurie 직원용 부트캠프·마스터 초대',
    endpoints: [
      {
        id: 'admin-login',
        label: '어드민 로그인',
        method: 'POST',
        path: '/admin/auth/login',
        backend: 'missing',
        frontendHook: 'missing',
      },
      {
        id: 'admin-bootcamps',
        label: '부트캠프 목록·생성',
        method: 'GET',
        path: '/admin/bootcamps',
        backend: 'missing',
        frontendHook: 'missing',
      },
      {
        id: 'admin-master-invite',
        label: '마스터 초대',
        method: 'POST',
        path: '/admin/bootcamps/{id}/master-invitations',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
  demoRequest: {
    id: 'demoRequest',
    title: '도입 문의',
    description: '마케팅 리드 수집',
    endpoints: [
      {
        id: 'lead-submit',
        label: '도입 문의 제출',
        method: 'POST',
        path: '/marketing/leads',
        backend: 'missing',
        frontendHook: 'missing',
      },
    ],
  },
} satisfies Record<string, ApiIntegrationGroup>;

export type ApiIntegrationGroupId = keyof typeof API_INTEGRATION_GROUPS;

export function getApiIntegrationGroup(id: ApiIntegrationGroupId): ApiIntegrationGroup {
  return API_INTEGRATION_GROUPS[id];
}
