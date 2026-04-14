import {
  getDisplayType,
  normalizeQuestionOptions,
  normalizeQuestionType,
  type BackendQuestionType,
  type QuestionDisplayType,
} from '@/modules/question/question-contract';

export interface OptionDTO {
  id: string;
  text?: string;
  code?: string;
  label?: string;
}

export interface QuestionDTO {
  id: string;
  text: string;
  type: BackendQuestionType;
  questionType: BackendQuestionType;
  displayType: QuestionDisplayType;
  options: OptionDTO[];
  difficulty: string;
  codeSnippet?: string | null;
  // CRITICAL: No correct answer here!
}

export interface ExamStartDTO {
  examId: string;
  status: string;
  totalQuestions: number;
  durationSeconds: number | null;
  remainingSeconds: number | null;
  firstQuestion: QuestionDTO | null;
}

export interface DimensionScoreDTO {
  dimension: string;
  name: string;
  score: number;
  total: number;
  percentage: number;
}

export interface ExamResultDTO {
  examId: string;
  overallScore: number;
  timeTaken: number;
  dimensions: DimensionScoreDTO[];
  completedAt: Date;
}

type QuestionInput = {
  id: string;
  questionText?: string;
  text?: string;
  type: string;
  difficulty?: string;
  options?: unknown;
  codeSnippet?: string | null;
};

export type ExamStartInput = {
  examId: string;
  status: string;
  totalQuestions: number;
  durationSeconds: number | null;
  remainingSeconds: number | null;
  firstQuestion?: QuestionInput | null;
};

type ScoreDimensionInput = {
  type: string;
  name: string;
  score: number;
  total: number;
  accuracy?: number;
  percentage?: number;
};

type ExamReportInput = {
  examId?: string;
  id?: string;
  score?: number | {
    overallScore?: number;
    timeTaken?: number;
    dimensions?: ScoreDimensionInput[] | null;
    completedAt?: Date;
  } | null;
  total?: number;
  percentage?: number;
  completedAt?: Date | null;
  timeTaken?: number | string;
};

/**
 * Mappers
 */
export function toQuestionDTO(q: QuestionInput | null | undefined): QuestionDTO | null {
  if (q === null || q === undefined) return null;
  const type = normalizeQuestionType(q.type);
  const options = normalizeQuestionOptions(q.options).map((option) => ({
    id: option.id,
    ...(option.text !== undefined ? { text: option.text } : {}),
    ...(option.code !== undefined ? { code: option.code } : {}),
    ...(option.label !== undefined ? { label: option.label } : {}),
  }));

  return {
    id: q.id,
    text: q.questionText ?? q.text ?? '',
    type,
    questionType: type,
    displayType: getDisplayType({
      questionText: q.questionText ?? q.text ?? '',
      codeSnippet: q.codeSnippet ?? null,
    }),
    difficulty: q.difficulty ?? 'intermediate',
    options,
    codeSnippet: q.codeSnippet ?? null,
  };
}

export function toExamStartDTO(examData: ExamStartInput): ExamStartDTO {
  return {
    examId: examData.examId,
    status: examData.status,
    totalQuestions: examData.totalQuestions,
    durationSeconds: examData.durationSeconds,
    remainingSeconds: examData.remainingSeconds,
    firstQuestion: examData.firstQuestion !== null && examData.firstQuestion !== undefined ? toQuestionDTO(examData.firstQuestion) : null,
  };
}

export function toExamResultDTO(reportRaw: ExamReportInput): ExamResultDTO {
  const nestedScore = typeof reportRaw.score === 'object' && reportRaw.score !== null ? reportRaw.score : null;
  const overallScore = nestedScore?.overallScore ?? (typeof reportRaw.score === 'number' ? reportRaw.score : reportRaw.percentage ?? 0);
  const parsedTimeRaw =
    typeof reportRaw.timeTaken === 'number'
      ? reportRaw.timeTaken
      : nestedScore?.timeTaken ?? 0;
  const parsedTime = Number.isFinite(parsedTimeRaw) ? parsedTimeRaw : 0;
  const dimensions = nestedScore?.dimensions ?? [];
  const completedAt = nestedScore?.completedAt ?? reportRaw.completedAt ?? new Date();

  return {
    examId: reportRaw.examId ?? reportRaw.id ?? '',
    overallScore,
    timeTaken: parsedTime,
    dimensions: dimensions.map((d) => ({
      dimension: d.type,
      name: d.name,
      score: d.score,
      total: d.total,
      percentage: d.accuracy ?? d.percentage ?? 0
    })),
    completedAt
  };
}
