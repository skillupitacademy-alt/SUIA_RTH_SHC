import { BrandConfig } from '../../brandConfig';

export interface ExamSummaryReportProps {
  brand: BrandConfig;
  examId?: string;
}

export interface PerformanceMetric {
  id?: string;
  name: string;
  score?: number;
  total?: number;
  accuracy?: number;
  attempts?: number;
  dimensionId?: string;
}

export interface QuestionDetail {
  id: string;
  text?: string;
  userAnswer: string | null;
  correctAnswer?: string;
  explanation?: string;
  isCorrect?: boolean | null;
  timeSpent?: number;
}

export interface ExamSummaryData {
  status: 'completed' | 'processing' | 'started' | 'failed' | 'abandoned';
  message?: string;
  examId?: string;
  id?: string;
  score: number;
  total: number;
  percentage: number;
  statusLabel?: 'passed' | 'failed';
  timeTaken?: string;
  percentile?: number;
  totalTimeSpentSeconds?: number;
  performance?: {
    topic?: PerformanceMetric[];
    difficulty?: PerformanceMetric[];
    skill?: PerformanceMetric[];
    subtopic?: PerformanceMetric[];
  };
  questions?: QuestionDetail[];
  lineage?: {
    domain?: string;
    subject?: string;
    topic?: string;
  };
  completedAt?: string;
  startedAt?: string;
}

export interface SkillItem {
  name: string;
  icon: React.ReactNode;
  accuracy: number;
  score: number;
  total: number;
}
