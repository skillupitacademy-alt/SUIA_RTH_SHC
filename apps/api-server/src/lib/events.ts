/**
 * Application Event Type Definitions
 * All event payloads must be defined here.
 */
export const AppEvents = {
  EXAM_STARTED: 'exam.started',
  EXAM_COMPLETED: 'exam.completed',
  EXAM_FAILED: 'exam.failed',
  EXAM_ABANDONED: 'exam.abandoned',
  EXAM_EXPIRED: 'exam.expired',
  USER_SIGNED_UP: 'user.signed_up',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  PASSWORD_RESET: 'user.password_reset',
  QUESTION_CREATED: 'content.question_created',
  QUESTION_UPDATED: 'content.question_updated',
  SYSTEM_HEALTH_CHECK: 'system.health_check',
  BACKGROUND_JOB_FAILED: 'system.job_failed',
  REPORT_GENERATED: 'report.generated',
} as const;

export type AppEvent = typeof AppEvents[keyof typeof AppEvents];

/** Constants for backward compatibility with modules/core/events */
export const DOMAIN_EVENTS = AppEvents;

export interface ExamStartedPayload {
  examId: string;
  userId: string;
  blueprintId: string;
  questionCount: number;
  startedAt: Date;
}

export interface ExamCompletedPayload {
  examId: string;
  userId: string;
  overallScore?: number; // Optional for backward compatibility with Score/OverallScore
  score?: number;
  completedAt: Date;
}

export interface ExamFailedPayload {
  examId: string;
  userId: string;
  reason?: string;
  error?: string;
  failedAt: Date;
}

export interface JobFailedPayload {
  jobId: string;
  jobType: string;
  error: string;
}

export interface UserSignedUpPayload {
  userId: string;
  email: string;
  signedUpAt: Date;
}

export interface UserLoggedInPayload {
  userId: string;
  ip: string;
  userAgent: string;
  loggedInAt: Date;
}

export interface QuestionCreatedPayload {
  questionId: string;
  adminId: string;
  topicId: string;
  createdAt: Date;
}

// Map event names to their strongly-typed payloads
export interface DomainEventMap {
  [AppEvents.EXAM_STARTED]: ExamStartedPayload;
  [AppEvents.EXAM_COMPLETED]: ExamCompletedPayload;
  [AppEvents.EXAM_FAILED]: ExamFailedPayload;
  [AppEvents.BACKGROUND_JOB_FAILED]: JobFailedPayload;
  [key: string]: unknown;
}
