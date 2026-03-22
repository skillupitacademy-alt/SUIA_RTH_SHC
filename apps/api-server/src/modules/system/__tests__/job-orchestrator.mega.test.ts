import { JobStatus, JobType } from '@quiz/types';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

// 1. JobOrchestrator Mega Test
const getJob = vi.fn();
const updateJobStatus = vi.fn();
const simulateJob = vi.fn();
const isHighLoad = vi.fn();
const calculateExamResults = vi.fn().mockResolvedValue(100);
const processExamResults = vi.fn().mockResolvedValue({});
const refreshAllViews = vi.fn().mockResolvedValue({});
const indexQuestion = vi.fn().mockResolvedValue({});
const performCleanup = vi.fn().mockResolvedValue({ deletedCount: 5 });
const sendEmail = vi.fn().mockResolvedValue({});
const sendPasswordResetEmail = vi.fn().mockResolvedValue({});
const refreshAnalytics = vi.fn().mockResolvedValue({});
const materialize = vi.fn().mockResolvedValue({});
const getPremiumExamReport = vi.fn().mockResolvedValue({});
const cacheReport = vi.fn().mockResolvedValue({});
const examSagaExecute = vi.fn().mockResolvedValue({});
const exportSagaExecute = vi.fn().mockResolvedValue({});

vi.mock('../jobs.service', () => ({ JobsService: { getJob, updateJobStatus, simulateJob } }));
vi.mock('@/modules/core/resilience.manager', () => ({ resilienceManager: { isHighLoad } }));
vi.mock('@/modules/scoring-engine/scoring.engine', () => ({ ScoringEngine: { calculateExamResults } }));
vi.mock('@/modules/tutor/tutor.service', () => ({ TutorService: { processExamResults } }));
vi.mock('@/modules/analytics/analytics.service', () => ({ AnalyticsService: { refreshAllViews } }));
vi.mock('@/modules/intelligence/semantic-search.service', () => ({ SemanticSearchService: { indexQuestion } }));
vi.mock('../retention.service', () => ({ RetentionService: { performCleanup } }));
vi.mock('@/modules/email/EmailService', () => ({ EmailService: { getInstance: () => ({ sendEmail, sendPasswordResetEmail }) } }));
vi.mock('@/modules/report-engine/performance.service', () => ({ PerformanceService: class { refreshAnalytics = refreshAnalytics; cacheReport = cacheReport; } }));
vi.mock('@/modules/report-engine/report.engine', () => ({ ReportEngine: class { getPremiumExamReport = getPremiumExamReport; } }));
vi.mock('../../services/reports/ReportMaterializer', () => ({ ReportMaterializer: { materialize } }));
vi.mock('@/services/reports/ReportMaterializer', () => ({ ReportMaterializer: { materialize } }));
vi.mock('@/modules/core/container', () => ({ container: { get: vi.fn((c) => new c()) } }));
vi.mock('../exam-engine/exam.saga', () => ({ ExamSaga: { execute: examSagaExecute } }));
vi.mock('@/lib/export/export.saga', () => ({ ExportSaga: { execute: exportSagaExecute } }));
vi.mock('@/lib/logger', () => ({ logger: { child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) } }));

import { JobOrchestrator } from '../job-orchestrator';

describe('JobOrchestrator Ultimate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.QSTASH_TOKEN = 'mock';
    });

    it('covers all handlers in runJob', async () => {
        getJob.mockResolvedValue({ status: 'pending', id: 'j' });
        
        const types = [
            JobType.EXAM_SCORING, JobType.ANALYTICS_REFRESH, JobType.SEMANTIC_INDEXING,
            JobType.MOCK_JOB, JobType.DATA_CLEANUP, JobType.EMAIL_SEND,
            JobType.ANALYTICS_PROCESS, JobType.EXAM_SAGA, JobType.EXPORT_SAGA
        ];

        for (const type of types) {
           getJob.mockResolvedValueOnce({ status: 'pending', type, id: 'j', payload: { examId: 'e1', type: 'post_exam_processing', questionId: 'q1', text: 'hi', email: 'a@b.com', data: {} } });
           await JobOrchestrator.runJob('j', 'u1');
        }
        expect(updateJobStatus).toHaveBeenCalled();
    });

    it('covers runJobDirectly and failures', async () => {
        await JobOrchestrator.runJobDirectly(JobType.EXAM_SCORING, { examId: 'e1' }, 'u1');
        await JobOrchestrator.runJobDirectly(JobType.ANALYTICS_PROCESS, { type: 'post_exam_processing', examId: 'e1' }, 'u1');
        await expect(JobOrchestrator.runJobDirectly('INVALID' as any, {}, 'u1')).rejects.toThrow();
    });
});
