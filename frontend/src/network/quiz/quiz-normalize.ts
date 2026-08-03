import type {
    QuizChoiceItem,
    QuizDifficulty,
    QuizItem,
    QuizPurpose,
    QuizQuestionChoiceItem,
    QuizQuestionItem,
    QuizQuestionsResponse,
    QuizSetDetailResponse,
    QuizSetStatus,
    QuizType,
} from './quiz-apis';

/**
 * AI 콜백/상태 원형과 백엔드 camelCase 응답을 모두 받을 수 있게 느슨하게 둔다.
 * 백엔드가 이미 변환해 줘도, 필드가 snake_case 로 새는 경우를 FE 에서 흡수한다.
 */
type RawChoice = string | { idx?: number; content?: string; answer?: boolean };

type RawQuiz = {
    id?: number;
    type?: string;
    purpose?: string;
    difficulty?: string;
    testedConcept?: string;
    tested_concept?: string;
    question?: string;
    explanation?: string;
    filePath?: string;
    file_path?: string;
    lineStart?: number | null;
    line_start?: number | null;
    lineEnd?: number | null;
    line_end?: number | null;
    timeLimitSec?: number;
    orderNo?: number;
    choices?: RawChoice[];
    answerIndex?: number;
    answer_index?: number;
};

type RawQuizSet = {
    quizSetId?: number;
    quiz_set_id?: number;
    status?: string;
    generationStage?: string | null;
    requestedCount?: number;
    generatedCount?: number;
    errorMessage?: string | null;
    error_message?: string | null;
    quizzes?: RawQuiz[];
};

const PURPOSES = new Set<QuizPurpose>(['CONCEPTUAL', 'MICRO']);
const DIFFICULTIES = new Set<QuizDifficulty>(['EASY', 'NORMAL', 'HARD']);
const TYPES = new Set<QuizType>(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK']);

/** AI 는 READY, 백엔드는 COMPLETED — UI/폴링은 둘 다 완료로 본다. */
export function normalizeQuizSetStatus(status: string | undefined | null): QuizSetStatus {
    if (status === 'READY' || status === 'COMPLETED') return 'COMPLETED';
    if (status === 'FAILED') return 'FAILED';
    if (status === 'QUEUED' || status === 'PENDING') return 'QUEUED';
    if (status === 'GENERATING') return 'GENERATING';
    return 'GENERATING';
}

function asPurpose(value: string | undefined): QuizPurpose {
    if (value && PURPOSES.has(value as QuizPurpose)) return value as QuizPurpose;
    return 'MICRO';
}

function asDifficulty(value: string | undefined): QuizDifficulty {
    if (value && DIFFICULTIES.has(value as QuizDifficulty)) return value as QuizDifficulty;
    return 'NORMAL';
}

function asType(value: string | undefined): QuizType {
    if (value && TYPES.has(value as QuizType)) return value as QuizType;
    return 'MULTIPLE_CHOICE';
}

function choiceContent(raw: RawChoice, fallbackIdx: number): { idx: number; content: string; answer?: boolean } {
    if (typeof raw === 'string') {
        return { idx: fallbackIdx, content: raw };
    }
    return {
        idx: typeof raw.idx === 'number' ? raw.idx : fallbackIdx,
        content: typeof raw.content === 'string' ? raw.content : String(raw.content ?? ''),
        answer: raw.answer === true,
    };
}

function normalizeChoicesForManager(raw: RawQuiz): QuizChoiceItem[] {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const answerIndex =
        typeof raw.answer_index === 'number'
            ? raw.answer_index
            : typeof raw.answerIndex === 'number'
              ? raw.answerIndex
              : -1;

    return choices.map((c, i) => {
        const normalized = choiceContent(c, i);
        const answer =
            typeof normalized.answer === 'boolean' ? normalized.answer : normalized.idx === answerIndex;
        return { idx: normalized.idx, content: normalized.content, answer };
    });
}

function normalizeChoicesForStudent(raw: RawQuiz): QuizQuestionChoiceItem[] {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    return choices.map((c, i) => {
        const normalized = choiceContent(c, i);
        return { idx: normalized.idx, content: normalized.content };
    });
}

function baseFields(raw: RawQuiz, orderFallback: number) {
    return {
        id: typeof raw.id === 'number' ? raw.id : orderFallback,
        type: asType(raw.type),
        difficulty: asDifficulty(raw.difficulty),
        testedConcept: raw.testedConcept ?? raw.tested_concept ?? '',
        question: raw.question ?? '',
        filePath: raw.filePath ?? raw.file_path ?? '',
        lineStart: raw.lineStart ?? raw.line_start ?? null,
        lineEnd: raw.lineEnd ?? raw.line_end ?? null,
        timeLimitSec: typeof raw.timeLimitSec === 'number' ? raw.timeLimitSec : 60,
        orderNo: typeof raw.orderNo === 'number' ? raw.orderNo : orderFallback,
    };
}

export function normalizeManagerQuiz(raw: RawQuiz, orderFallback: number): QuizItem {
    return {
        ...baseFields(raw, orderFallback),
        purpose: asPurpose(raw.purpose),
        explanation: raw.explanation ?? '',
        choices: normalizeChoicesForManager(raw),
    };
}

export function normalizeStudentQuiz(raw: RawQuiz, orderFallback: number): QuizQuestionItem {
    return {
        ...baseFields(raw, orderFallback),
        choices: normalizeChoicesForStudent(raw),
    };
}

export function normalizeQuizSetDetail(data: unknown): QuizSetDetailResponse {
    const raw = (data ?? {}) as RawQuizSet;
    const quizzes = Array.isArray(raw.quizzes) ? raw.quizzes : [];
    return {
        quizSetId: raw.quizSetId ?? raw.quiz_set_id ?? 0,
        status: normalizeQuizSetStatus(raw.status),
        generationStage: raw.generationStage ?? null,
        requestedCount: typeof raw.requestedCount === 'number' ? raw.requestedCount : quizzes.length,
        generatedCount: typeof raw.generatedCount === 'number' ? raw.generatedCount : quizzes.length,
        errorMessage: raw.errorMessage ?? raw.error_message ?? null,
        quizzes: quizzes.map((q, i) => normalizeManagerQuiz(q, i + 1)),
    };
}

export function normalizeQuizQuestions(data: unknown): QuizQuestionsResponse {
    const raw = (data ?? {}) as RawQuizSet;
    const quizzes = Array.isArray(raw.quizzes) ? raw.quizzes : [];
    return {
        quizSetId: raw.quizSetId ?? raw.quiz_set_id ?? 0,
        status: normalizeQuizSetStatus(raw.status),
        generationStage: raw.generationStage ?? null,
        requestedCount: typeof raw.requestedCount === 'number' ? raw.requestedCount : quizzes.length,
        quizzes: quizzes.map((q, i) => normalizeStudentQuiz(q, i + 1)),
    };
}

export function formatQuizSource(filePath: string, lineStart: number | null, lineEnd: number | null): string | null {
    const path = filePath.trim();
    if (!path) return null;
    if (lineStart != null && lineEnd != null && lineStart !== lineEnd) {
        return `${path}:${lineStart}–${lineEnd}`;
    }
    if (lineStart != null) return `${path}:${lineStart}`;
    return path;
}
