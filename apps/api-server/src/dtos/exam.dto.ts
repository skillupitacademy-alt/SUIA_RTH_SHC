export interface OptionDTO {
  id: string;
  text: string;
  label: string;
}

export interface QuestionDTO {
  id: string;
  text: string;
  type: string;
  options: OptionDTO[];
  difficulty: string;
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

type ExamOptionInput = { id: string; text: string; label: string };
type QuestionInput = {
  id: string;
  questionText?: string;
  text?: string;
  type: string;
  difficulty?: string;
  options?: unknown;
};

type ExamStartInput = {
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
  const options = Array.isArray(q.options)
    ? q.options.map((opt, index) => {
        if (typeof opt === 'string') {
          return { id: String(index + 1), text: opt, label: String.fromCharCode(65 + index) };
        }
        const maybe = opt as Partial<ExamOptionInput>;
        return {
          id: maybe.id ?? String(index + 1),
          text: maybe.text ?? '',
          label: maybe.label ?? String.fromCharCode(65 + index),
        };
      })
    : [];
  return {
    id: q.id,
    text: q.questionText ?? q.text ?? '',
    type: q.type,
    difficulty: q.difficulty ?? 'intermediate',
    options
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
    completedAt: completedAt ?? new Date()
  };
}
