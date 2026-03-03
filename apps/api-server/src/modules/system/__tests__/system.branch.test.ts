import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobOrchestrator } from '../job-orchestrator';
import { UsageService } from '../usage.service';
import { ReportMaterializer } from '@/services/reports/ReportMaterializer';
import { JobsService } from '../jobs.service';
import { db, exams } from '@quiz/db';
import { JobStatus, JobType } from '@quiz/types';
import { resilienceManager } from '@/modules/core/resilience.manager';

vi.mock('../jobs.service');
vi.mock('@/modules/core/resilience.manager');
vi.mock('@quiz/db', () => ({
    db: {
        query: {
            exams: { findFirst: vi.fn() },
            subtopics: { findMany: vi.fn() },
            backgroundJobs: { findFirst: vi.fn() }
        },
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), catch: vi.fn() }),
        execute: vi.fn()
    },
    exams: { id: 'id' },
    subtopics: { id: 'id' }
}));

describe('System & Reports branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('JobOrchestrator resilience and unknown types (Lines 37-43, 65)', async () => {
        vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j1', status: 'pending', type: JobType.ANALYTICS_REFRESH } as any);
        vi.mocked(resilienceManager.isHighLoad).mockReturnValue(true);

        // High load dropping analytics (Lines 37-43)
        await JobOrchestrator.runJob('j1', 'u1');
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j1', JobStatus.FAILED, expect.any(Object));

        // Unknown type (Line 65)
        vi.mocked(resilienceManager.isHighLoad).mockReturnValue(false);
        vi.mocked(JobsService.getJob).mockResolvedValue({ id: 'j2', status: 'pending', type: 'UNKNOWN' } as any);
        await JobOrchestrator.runJob('j2', 'u1');
        expect(JobsService.updateJobStatus).toHaveBeenCalledWith('j2', JobStatus.FAILED, expect.objectContaining({ error: expect.stringContaining('Unknown job type') }));
    });

    it('UsageService Cloudflare and Redis failure branches (Lines 235-241, 142)', async () => {
        process.env.CLOUDFLARE_API_TOKEN = 't';
        process.env.CLOUDFLARE_ZONE_ID = 'z';
        
        // Mock fetch for Cloudflare non-OK status (Line 235)
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Forbidden'
        }));

        const usage = await (UsageService as any).getCloudflareStats();
        expect((usage as any).status).toBe('_error');
        expect((usage as any)._error.message).toContain('Cloudflare API Error');

        // Mock fetch for Cloudflare Data errors (Lines 240-241)
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ errors: [{ message: 'GraphQL Fail' }] })
        }));
        const usage2 = await (UsageService as any).getCloudflareStats();
        expect((usage2 as any)._error.message).toBe('GraphQL Fail');
        
        vi.unstubAllGlobals();
    });

    it('ReportMaterializer empty subtopics branch (Line 75/76)', async () => {
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'e1', userId: 'u1',
            examQuestions: [{
                id: 'eq1', question: { questionText: 'Q', correctAnswer: 'A', topic: { name: 'T', subject: { name: 'S', domain: { name: 'D' } } } },
                responseMetadata: { timeSpentSeconds: 10 }
            }]
        } as any);

        // No subtopics in questions
        const report = await ReportMaterializer.materialize('e1');
        expect(db.query.subtopics.findMany).not.toHaveBeenCalled();
        expect(report.meta.totalQuestions).toBe(1);
    });
});
