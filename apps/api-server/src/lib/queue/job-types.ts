/**
 * Strictly typed payloads for all BullMQ Background Jobs
 */

export interface ScoringJobPayload {
  examId: string;
  profileId: string;
}

export interface EmailJobPayload {
  to: string;
  subject: string;
  template?: 'welcome' | 'exam_completed' | 'password_reset';
  html?: string;
  data?: Record<string, unknown>;
}

export interface CleanupJobPayload {
  target: 'stale_sessions' | 'abandoned_exams';
  olderThanDays: number;
}

export interface NotificationJobPayload {
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'achievement' | 'alert';
}

export interface ExamSagaPayload {
  examId: string;
  userId: string;
}

export interface AnalyticsJobPayload {
  examId: string;
  processingType: 'post_exam_processing' | 'daily_refresh';
}

// Union type for all supported jobs if needed
export type AppJobPayload = 
  | ScoringJobPayload 
  | EmailJobPayload 
  | AnalyticsJobPayload
  | ExamSagaPayload
  | CleanupJobPayload 
  | NotificationJobPayload;
