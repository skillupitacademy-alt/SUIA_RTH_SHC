export enum JobType {
    EXAM_SCORING = 'EXAM_SCORING',
    ANALYTICS_REFRESH = 'ANALYTICS_REFRESH',
    SEMANTIC_INDEXING = 'SEMANTIC_INDEXING',
    MOCK_JOB = 'MOCK_JOB',
    DATA_CLEANUP = 'DATA_CLEANUP',
    EMAIL_SEND = 'EMAIL_SEND',
    ANALYTICS_PROCESS = 'ANALYTICS_PROCESS',
    EXAM_SAGA = 'EXAM_SAGA',
    BULK_IMPORT = 'BULK_IMPORT'
}

export enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface JobPayload {
    examId?: string;
    [key: string]: unknown;
}

export interface JobResult {
    examId?: string;
    finalScore?: number;
    completedAt?: string;
    currentStep?: string;
    [key: string]: unknown;
}

export interface Job {
    id: string;
    userId: string;
    type: JobType | string;
    status: JobStatus | string;
    payload: JobPayload | any;
    result?: JobResult | any;
    error?: string | null;
    progress?: number | null;
    createdAt: Date | string;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    updatedAt?: Date | string | null;
}

export interface CreateJobInput {
    userId: string;
    type: JobType | string;
    payload?: JobPayload | any;
}
