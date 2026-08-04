/**
 * 시연용 지난 세션·퀴즈 목업. AI/백엔드 연동 전 프론트 전용.
 * 실 API 붙일 때 이 모듈의 훅만 교체하면 된다.
 */

export type PastSessionMock = {
  sessionId: number;
  title: string;
  endedAt: string;
  aiSummary: string;
  quizSetId: number;
  scoreCorrect: number;
  scoreTotal: number;
  reportHighlights: {
    overall: string;
    strengths: string[];
    improvements: string[];
    nextSuggestion: string;
  };
};

export type PastQuizChoice = {
  idx: number;
  content: string;
};

export type PastQuizItem = {
  id: number;
  orderNo: number;
  question: string;
  choices: PastQuizChoice[];
  correctIdx: number;
  userChoiceIdx: number | null;
  isCorrect: boolean | null;
  explanation: string;
  wrongTypeTag?: string;
};

export type PastQuizSetMock = {
  quizSetId: number;
  sessionId: number;
  sessionTitle: string;
  endedAt: string;
  scoreCorrect: number;
  scoreTotal: number;
  wrongTypeTags: string[];
  aiWrongAnalysis: string;
  items: PastQuizItem[];
};

const PAST_SESSIONS: PastSessionMock[] = [
  {
    sessionId: 101,
    title: 'React hooks 실습',
    endedAt: '2026-07-28T15:40:00+09:00',
    aiSummary:
      'useEffect 의존성 배열과 메모이제이션 개념은 잘 잡혔고, 커스텀 훅 분리에서 실수가 많았습니다. 다음엔 상태 끌어올리기 패턴을 복습하면 좋아요.',
    quizSetId: 501,
    scoreCorrect: 3,
    scoreTotal: 5,
    reportHighlights: {
      overall: '훅 기본기는 안정적이에요. 커스텀 훅 경계와 의존성 관리만 다듬으면 다음 세션 속도가 빨라질 거예요.',
      strengths: ['useState/useEffect 기본 흐름', '조건부 렌더링 판단'],
      improvements: ['커스텀 훅 의존성 누락', '불필요한 리렌더 유발 패턴'],
      nextSuggestion: '커스텀 훅으로 데이터 fetch 로직을 분리하는 미니 미션을 추천해요.',
    },
  },
  {
    sessionId: 102,
    title: '알고리즘 · 투 포인터',
    endedAt: '2026-07-30T17:10:00+09:00',
    aiSummary:
      '정렬된 배열에서의 투 포인터는 잘 풀었고, 슬라이딩 윈도우 경계 조건에서 오답이 집중됐습니다. 인덱스 이동 순서를 말로 설명해 보는 연습이 필요해요.',
    quizSetId: 502,
    scoreCorrect: 2,
    scoreTotal: 5,
    reportHighlights: {
      overall: '패턴 인식은 빠른 편이에요. 경계값(빈 배열, 단일 요소) 케이스를 습관적으로 점검하면 정답률이 오를 거예요.',
      strengths: ['정렬 전제 투 포인터', '시간복잡도 감각'],
      improvements: ['윈도우 축소/확장 순서', '중복 제거 조건'],
      nextSuggestion: '슬라이딩 윈도우 템플릿을 직접 손으로 한 번 더 적어보세요.',
    },
  },
  {
    sessionId: 103,
    title: 'Spring 트랜잭션',
    endedAt: '2026-08-01T14:20:00+09:00',
    aiSummary:
      '전파 속성과 롤백 규칙은 이해도가 높고, 프록시 한계·self-invocation에서 감점이 있었습니다. 트랜잭션 경계를 서비스 레이어에 두는 이유를 복습하세요.',
    quizSetId: 503,
    scoreCorrect: 4,
    scoreTotal: 5,
    reportHighlights: {
      overall: '전반적으로 우수해요. 프록시 기반 AOP 한계만 잡으면 실무 이슈 대응이 한결 수월해집니다.',
      strengths: ['REQUIRED vs REQUIRES_NEW', '체크 예외 롤백 규칙'],
      improvements: ['self-invocation 시 트랜잭션 미적용'],
      nextSuggestion: '내부 메서드 호출을 별도 빈으로 분리하는 리팩터링을 시도해 보세요.',
    },
  },
];

function buildQuizSet(session: PastSessionMock, items: PastQuizItem[]): PastQuizSetMock {
  const wrongTags = [
    ...new Set(items.filter((i) => i.isCorrect === false && i.wrongTypeTag).map((i) => i.wrongTypeTag!)),
  ];
  return {
    quizSetId: session.quizSetId,
    sessionId: session.sessionId,
    sessionTitle: session.title,
    endedAt: session.endedAt,
    scoreCorrect: session.scoreCorrect,
    scoreTotal: session.scoreTotal,
    wrongTypeTags: wrongTags,
    aiWrongAnalysis:
      wrongTags.length === 0
        ? '이번 세트에서는 뚜렷한 오답 유형이 없어요. 유지 복습만으로도 충분합니다.'
        : `주로 [${wrongTags.join(', ')}] 유형에서 감점이 났어요. 틀린 문항의 선택지를 다시 비교하고, 해설의 핵심 문장만 노트에 남겨 보세요.`,
    items,
  };
}

const QUIZ_SETS: PastQuizSetMock[] = [
  buildQuizSet(PAST_SESSIONS[0], [
    {
      id: 1,
      orderNo: 1,
      question: 'useEffect의 의존성 배열이 비어 있으면?',
      choices: [
        { idx: 0, content: '매 렌더마다 실행' },
        { idx: 1, content: '마운트 시 한 번만 실행' },
        { idx: 2, content: '언마운트 시에만 실행' },
        { idx: 3, content: '절대 실행되지 않음' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '빈 배열은 마운트(및 Strict Mode 개발 환경의 이중 호출) 기준으로 한 번 실행됩니다.',
    },
    {
      id: 2,
      orderNo: 2,
      question: 'useMemo를 쓰는 가장 적절한 이유는?',
      choices: [
        { idx: 0, content: '항상 성능을 보장하기 위해' },
        { idx: 1, content: '비싼 계산 결과를 캐시하기 위해' },
        { idx: 2, content: '상태를 영구 저장하기 위해' },
        { idx: 3, content: '이벤트 핸들러를 등록하기 위해' },
      ],
      correctIdx: 1,
      userChoiceIdx: 0,
      isCorrect: false,
      explanation: '비용이 큰 계산을 의존성이 바뀔 때만 다시 수행하려고 씁니다. 남용은 오히려 비용입니다.',
      wrongTypeTag: '개념혼동',
    },
    {
      id: 3,
      orderNo: 3,
      question: '커스텀 훅 이름은 보통 어떻게 시작하나요?',
      choices: [
        { idx: 0, content: 'get' },
        { idx: 1, content: 'use' },
        { idx: 2, content: 'with' },
        { idx: 3, content: 'on' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: 'Rules of Hooks를 지키기 위해 use로 시작합니다.',
    },
    {
      id: 4,
      orderNo: 4,
      question: '의존성 배열에 함수를 넣을 때 권장되는 패턴은?',
      choices: [
        { idx: 0, content: '매번 새 함수를 인라인으로 넣기' },
        { idx: 1, content: 'useCallback으로 안정화' },
        { idx: 2, content: '의존성에서 함수를 항상 제외' },
        { idx: 3, content: '전역 변수로만 관리' },
      ],
      correctIdx: 1,
      userChoiceIdx: 2,
      isCorrect: false,
      explanation: '함수 참조가 바뀌면 effect가 반복됩니다. useCallback으로 참조를 안정화하세요.',
      wrongTypeTag: '의존성관리',
    },
    {
      id: 5,
      orderNo: 5,
      question: '상태 업데이트 함수의 함수형 업데이트가 필요한 경우는?',
      choices: [
        { idx: 0, content: '이전 상태에 기반해 다음 값을 계산할 때' },
        { idx: 1, content: '항상' },
        { idx: 2, content: '문자열 상태일 때만' },
        { idx: 3, content: 'SSR에서만' },
      ],
      correctIdx: 0,
      userChoiceIdx: 0,
      isCorrect: true,
      explanation: '클로저로 오래된 state를 읽을 위험이 있을 때 함수형 업데이트가 안전합니다.',
    },
  ]),
  buildQuizSet(PAST_SESSIONS[1], [
    {
      id: 11,
      orderNo: 1,
      question: '정렬된 배열에서 합이 target인 두 수를 찾을 때 적합한 기법은?',
      choices: [
        { idx: 0, content: '투 포인터' },
        { idx: 1, content: 'DFS' },
        { idx: 2, content: '위상 정렬' },
        { idx: 3, content: '세그먼트 트리' },
      ],
      correctIdx: 0,
      userChoiceIdx: 0,
      isCorrect: true,
      explanation: '정렬되어 있으면 양끝 포인터로 O(n)에 찾을 수 있습니다.',
    },
    {
      id: 12,
      orderNo: 2,
      question: '슬라이딩 윈도우에서 오른쪽을 늘린 뒤 보통 다음에 하는 일은?',
      choices: [
        { idx: 0, content: '무조건 왼쪽도 늘린다' },
        { idx: 1, content: '조건을 만족할 때까지 왼쪽을 줄인다' },
        { idx: 2, content: '배열을 다시 정렬한다' },
        { idx: 3, content: '재귀 호출한다' },
      ],
      correctIdx: 1,
      userChoiceIdx: 0,
      isCorrect: false,
      explanation: '윈도우를 확장한 뒤 제약을 깨면 왼쪽을 줄여 유효 구간을 유지합니다.',
      wrongTypeTag: '경계조건',
    },
    {
      id: 13,
      orderNo: 3,
      question: '빈 배열 입력에 대해 투 포인터를 돌릴 때 안전한 처리는?',
      choices: [
        { idx: 0, content: '인덱스 0을 바로 접근' },
        { idx: 1, content: '길이를 먼저 검사하고 early return' },
        { idx: 2, content: '무한 루프' },
        { idx: 3, content: '음수 인덱스로 접근' },
      ],
      correctIdx: 1,
      userChoiceIdx: 0,
      isCorrect: false,
      explanation: '경계 케이스를 먼저 걸러야 런타임 오류와 오답을 막습니다.',
      wrongTypeTag: '경계조건',
    },
    {
      id: 14,
      orderNo: 4,
      question: '서로 다른 인덱스의 두 수를 고를 때 같은 인덱스를 두 번 쓰면?',
      choices: [
        { idx: 0, content: '항상 정답' },
        { idx: 1, content: '문제 조건을 위반할 수 있음' },
        { idx: 2, content: '시간복잡도가 좋아짐' },
        { idx: 3, content: '정렬이 필요 없어짐' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '대부분의 two-sum 변형은 서로 다른 인덱스를 요구합니다.',
    },
    {
      id: 15,
      orderNo: 5,
      question: '윈도우 크기가 고정일 때 초기화로 알맞은 것은?',
      choices: [
        { idx: 0, content: '첫 k개 합을 구한 뒤 한 칸씩 밀기' },
        { idx: 1, content: '매번 전체 합을 다시 계산' },
        { idx: 2, content: '정렬 후 이분 탐색만' },
        { idx: 3, content: '스택만 사용' },
      ],
      correctIdx: 0,
      userChoiceIdx: 1,
      isCorrect: false,
      explanation: '고정 길이는 합을 유지하며 O(n)으로 밀면 됩니다.',
      wrongTypeTag: '경계조건',
    },
  ]),
  buildQuizSet(PAST_SESSIONS[2], [
    {
      id: 21,
      orderNo: 1,
      question: '@Transactional이 기본으로 롤백하는 예외는?',
      choices: [
        { idx: 0, content: '체크 예외' },
        { idx: 1, content: '언체크(런타임) 예외' },
        { idx: 2, content: '모든 Error만' },
        { idx: 3, content: 'IOException만' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '기본은 RuntimeException/Error에 대해 롤백합니다.',
    },
    {
      id: 22,
      orderNo: 2,
      question: '같은 클래스 내부에서 @Transactional 메서드를 this로 호출하면?',
      choices: [
        { idx: 0, content: '항상 새 트랜잭션' },
        { idx: 1, content: '프록시를 타지 않아 트랜잭션이 적용되지 않을 수 있음' },
        { idx: 2, content: '컴파일 오류' },
        { idx: 3, content: '무조건 롤백' },
      ],
      correctIdx: 1,
      userChoiceIdx: 0,
      isCorrect: false,
      explanation: 'Spring AOP 프록시를 우회하는 self-invocation 문제입니다.',
      wrongTypeTag: '프록시한계',
    },
    {
      id: 23,
      orderNo: 3,
      question: 'Propagation.REQUIRES_NEW의 의미는?',
      choices: [
        { idx: 0, content: '기존 트랜잭션에 참여' },
        { idx: 1, content: '항상 새 트랜잭션을 시작' },
        { idx: 2, content: '트랜잭션 없이 실행' },
        { idx: 3, content: '읽기 전용만 허용' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '진행 중이던 트랜잭션을 잠시 보류하고 새 트랜잭션을 엽니다.',
    },
    {
      id: 24,
      orderNo: 4,
      question: '트랜잭션 경계를 보통 어디에 두나요?',
      choices: [
        { idx: 0, content: '컨트롤러' },
        { idx: 1, content: '서비스 레이어' },
        { idx: 2, content: '뷰 템플릿' },
        { idx: 3, content: '정적 유틸' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '유스케이스 단위의 원자성을 서비스에서 보장하는 것이 일반적입니다.',
    },
    {
      id: 25,
      orderNo: 5,
      question: 'readOnly=true의 주된 이점은?',
      choices: [
        { idx: 0, content: '쓰기를 더 빠르게' },
        { idx: 1, content: '플러시/더티체킹 비용을 줄일 수 있음' },
        { idx: 2, content: '트랜잭션을 없앰' },
        { idx: 3, content: '락을 무조건 해제' },
      ],
      correctIdx: 1,
      userChoiceIdx: 1,
      isCorrect: true,
      explanation: '조회 전용임을 힌트하여 불필요한 쓰기 준비를 줄입니다.',
    },
  ]),
];

export function getPastSessionsMock(): PastSessionMock[] {
  return PAST_SESSIONS;
}

export function getPastSessionMock(sessionId: number): PastSessionMock | undefined {
  return PAST_SESSIONS.find((s) => s.sessionId === sessionId);
}

export function getPastQuizSetsMock(): PastQuizSetMock[] {
  return QUIZ_SETS;
}

export function getPastQuizSetMock(quizSetId: number): PastQuizSetMock | undefined {
  return QUIZ_SETS.find((q) => q.quizSetId === quizSetId);
}

export function getPastQuizSetBySessionId(sessionId: number): PastQuizSetMock | undefined {
  return QUIZ_SETS.find((q) => q.sessionId === sessionId);
}

/** 실제 sessionId와 목업을 느슨히 매칭 — 목록에 없는 id면 순환 샘플 */
export function resolvePastSessionMock(sessionId: number): PastSessionMock {
  return (
    getPastSessionMock(sessionId) ??
    PAST_SESSIONS[Math.abs(sessionId) % PAST_SESSIONS.length]
  );
}
