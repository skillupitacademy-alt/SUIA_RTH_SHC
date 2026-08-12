export type ExamQuestionStatus = 'unanswered' | 'completed' | 'marked';

export interface ExamAnswerOption {
  id: string;
  text?: string;
  code?: string;
}

export interface ExamQuestionItem {
  id: string;
  status: ExamQuestionStatus;
  question: {
    number: number;
    text: string;
    code?: string;
  };
  answers: ExamAnswerOption[];
  multiSelect: boolean;
}

export interface ExamStudentIdentity {
  name: string;
  identifierLabel: string;
  identifierValue: string;
}

export interface ExamProgressMetrics {
  answeredCount: number;
  markedCount: number;
  remainingCount: number;
  timeRemainingLabel: string;
  sectionLabel: string;
  metadataSummary: string;
}

export interface ExamSessionData {
  examId?: string;
  breadcrumb: string;
  student: ExamStudentIdentity;
  questions: ExamQuestionItem[];
  progress: ExamProgressMetrics;
}
