/**
 * Domain Events Definitions
 * Defines all system-wide orchestratable events and their payload schemas.
 */

export const DOMAIN_EVENTS = {
    // Exam Lifecycle
    EXAM_STARTED: 'exam.started',
    EXAM_COMPLETED: 'exam.completed',
    EXAM_FAILED: 'exam.failed',
    EXAM_ABANDONED: 'exam.abandoned',
    
    // User Lifecycle
    USER_REGISTERED: 'user.registered',
    USER_LOGIN: 'user.login',
    
    // System
    SYSTEM_HEALTH_CHECK: 'system.health_check',
    BACKGROUND_JOB_FAILED: 'system.job_failed',
    
    // Reporting
    REPORT_GENERATED: 'report.generated',
} as const;

export type EventConstants = typeof DOMAIN_EVENTS[keyof typeof DOMAIN_EVENTS];

export interface ExamCompletedPayload {
    examId: string;
    userId: string;
    score: number;
}

export interface ExamFailedPayload {
    examId: string;
    userId: string;
    error: string;
}

export interface JobFailedPayload {
    jobId: string;
    jobType: string;
    error: string;
}

// Map event names to their strongly-typed payloads
export interface DomainEventMap {
    [DOMAIN_EVENTS.EXAM_COMPLETED]: ExamCompletedPayload;
    [DOMAIN_EVENTS.EXAM_FAILED]: ExamFailedPayload;
    [DOMAIN_EVENTS.BACKGROUND_JOB_FAILED]: JobFailedPayload;
    // Add default unknown/fallback for others as we type them incrementally
    [key: string]: unknown;
}
