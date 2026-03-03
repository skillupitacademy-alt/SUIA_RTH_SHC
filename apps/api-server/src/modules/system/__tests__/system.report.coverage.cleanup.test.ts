import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { ReportMaterializer } from '../../../services/reports/ReportMaterializer';
import { JobsService } from '@/modules/system/jobs.service';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { UsageService } from '@/modules/system/usage.service';
import { resilienceManager } from '@/modules/core/resilience.manager';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            exams: { findFirst: vi.fn() },
            subtopics: { findMany: vi.fn() }
        },
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    },
    exams: { id: 'id' },
    subtopics: { id: 'id' }
}));

vi.mock('@/modules/system/jobs.service');
vi.mock('@/modules/core/resilience.manager');

describe('System and Report cleanup coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset process.env for resilience tests
        delete process.env.SAFE_MODE;
    });

    it('ReportMaterializer.materialize hits "Core Focus" fallback (Line 149)', async () => {
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            id: 'e1', userId: 'u1',
            examQuestions: [{
                id: 'eq1',
                userAnswer: 'A', isCorrect: true, responseMetadata: { timeSpentSeconds: 10 },
                question: {
                    questionText: 'Q1', correctAnswer: 'A', difficulty: 'simple', topicId: 't1', type: 'mcq',
                    topic: { id: 't1', name: 'T1', subjectId: 's1', subject: { id: 's1', name: 'S1', domainId: 'd1', domain: { id: 'd1', name: 'D1' } } }
                }
            }]
        } as any);
        // Mock empty subtopics to trigger "Core Focus" fallback
        vi.mocked(db.query.subtopics.findMany).mockResolvedValue([]);

        const report = await ReportMaterializer.materialize('e1');
        const topicData: any = Object.values(report.datasets.topics)[0];
        expect(topicData.subtopics[0].name).toBe('Core Focus');
    });

    it('JobOrchestrator returns early if job not found (Line 26-28)', async () => {
        vi.mocked(JobsService.getJob).mockResolvedValue(undefined);
        await expect(JobOrchestrator.runJob('none', 'u1')).resolves.not.toThrow();
    });

    it('UsageService.cloudflare handles response.ok === false (Line 235-237)', async () => {
        process.env.CLOUDFLARE_API_TOKEN = 'token';
        process.env.CLOUDFLARE_ZONE_ID = 'zone';
        
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Forbidden'
        });

        const usage = await (UsageService as any).getCloudflareStats();
        expect(usage.status).toBe('_error');
        expect(usage._error.message).toContain('Forbidden');
    });
});
