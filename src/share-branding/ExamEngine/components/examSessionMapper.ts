import { ExamSessionData, ExamQuestionItem, ExamQuestionStatus } from './examSession';

export interface ExamApiStudent {
  name: string;
  identifierLabel?: string | null;
  identifierValue: string;
}

export interface ExamApiQuestion {
  id: string;
  number: number;
  text: string;
  code?: string | null;
  status?: ExamQuestionStatus | null;
  multiSelect?: boolean | null;
  answers: Array<{
    id: string;
    text?: string | null;
    code?: string | null;
  }>;
}

export interface ExamApiResponse {
  examId?: string;
  breadcrumb: string;
  student: ExamApiStudent;
  progress: {
    answeredCount: number;
    markedCount: number;
    remainingCount: number;
    timeRemainingLabel: string;
    sectionLabel: string;
    metadataSummary: string;
  };
  questions: ExamApiQuestion[];
}

function mapQuestion(question: ExamApiQuestion): ExamQuestionItem {
  return {
    id: question.id,
    status: question.status ?? 'unanswered',
    question: {
      number: question.number,
      text: question.text,
      code: question.code ?? undefined,
    },
    answers: question.answers.map((answer) => ({
      id: answer.id,
      text: answer.text ?? undefined,
      code: answer.code ?? undefined,
    })),
    multiSelect: question.multiSelect ?? false,
  };
}

export function mapExamApiToSessionData(api: ExamApiResponse): ExamSessionData {
  return {
    examId: api.examId,
    breadcrumb: api.breadcrumb,
    student: {
      name: api.student.name,
      identifierLabel: api.student.identifierLabel ?? 'Student ID',
      identifierValue: api.student.identifierValue,
    },
    progress: {
      answeredCount: api.progress.answeredCount,
      markedCount: api.progress.markedCount,
      remainingCount: api.progress.remainingCount,
      timeRemainingLabel: api.progress.timeRemainingLabel,
      sectionLabel: api.progress.sectionLabel,
      metadataSummary: api.progress.metadataSummary,
    },
    questions: api.questions.map(mapQuestion),
  };
}
