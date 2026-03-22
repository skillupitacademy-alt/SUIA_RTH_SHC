import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { JobsService } from '@/modules/system/jobs.service';
import { storage } from '@/lib/storage';
import { db } from '@quiz/db';

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    getJobStatus: vi.fn(),
    updateJobStatus: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/storage', () => ({
  storage: {
    exists: vi.fn(),
    getSignedUrl: vi.fn().mockResolvedValue('http://signed-url'),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: vi.fn() },
    },
  },
  exams: { id: 'exams.id', userId: 'exams.userId', exportUrls: 'exams.exportUrls' },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  },
}));

vi.mock('@/lib/redis', () => ({
    redis: { get: vi.fn() },
}));

vi.mock('@/modules/core/container', () => ({
    container: { get: () => ({ getAccessToken: () => 'token', verifyUserAccessToken: async () => ({ userId: 'u1' }) }) }
}));

describe('Export Status Final Resolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.INTERNAL_API_KEY = 'secret';
    });

    const createReq = (jobId: string) => new NextRequest(`http://localhost/api/export/status/${jobId}`);

    it('covers all success paths', async () => {
        // Mock a completed job with storage
        vi.mocked(JobsService.getJobStatus).mockResolvedValue({ status: 'completed', id: 'j1', userId: 'u1', result: { downloadUrl: 'file.json' } });
        vi.mocked(storage.exists).mockResolvedValue(true);
        
        const res = await GET(createReq('j1'), { params: Promise.resolve({ jobId: 'j1' }) });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.status).toBe('completed');
    });

    it('covers stale job recovery', async () => {
        const twoMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
        vi.mocked(JobsService.getJobStatus).mockResolvedValue({ 
            status: 'processing', id: 'j1', userId: 'u1', updatedAt: twoMinsAgo, payload: { format: 'csv' } 
        });
        vi.mocked(storage.exists).mockResolvedValue(true);
        
        const res = await GET(createReq('j1'), { params: Promise.resolve({ jobId: 'j1' }) });
        const data = await res.json();
        expect(data.status).toBe('completed'); // Auto-recovered
    });

    it('covers error branches', async () => {
        // Job not found
        vi.mocked(JobsService.getJobStatus).mockResolvedValue(null);
        let res = await GET(createReq('none'), { params: Promise.resolve({ jobId: 'none' }) });
        expect(res.status).toBe(404);

        // examId fallback recovery
        const req = new NextRequest('http://localhost/api/export/status/none?examId=e1');
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ id: 'e1', userId: 'u1', exportUrls: { analytics_json: 'file.json' } });
        vi.mocked(storage.exists).mockResolvedValue(true);
        res = await GET(req, { params: Promise.resolve({ jobId: 'none' }) });
        expect(res.status).toBe(200);
    });
});
