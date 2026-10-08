import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getQuizHierarchy } from '../apps/web-app/src/app/api/bff/quiz-hierarchy/route';
import { GET as getExamConfig } from '../apps/web-app/src/app/api/bff/exam-config/route';

function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('BFF quiz selection routes', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('aggregates domains and hierarchy in /api/bff/quiz-hierarchy', async () => {
        const domains = [
            { id: 'dom-1', name: 'Domain 1' },
            { id: 'dom-2', name: 'Domain 2' },
        ];
        const hierarchy1 = { id: 'dom-1', name: 'Domain 1', subjects: [] };
        const hierarchy2 = { id: 'dom-2', name: 'Domain 2', subjects: [] };

        const fetchMock = vi.fn(async (input: RequestInfo) => {
            const url = typeof input === 'string' ? input : input.url;
            if (url.endsWith('/domains')) return jsonResponse(domains);
            if (url.includes('/domains?id=dom-1')) return jsonResponse(hierarchy1);
            if (url.includes('/domains?id=dom-2')) return jsonResponse(hierarchy2);
            return new Response('not found', { status: 404 });
        });

        vi.stubGlobal('fetch', fetchMock);

        const res = await getQuizHierarchy();
        expect(res.status).toBe(200);
        expect(res.headers.get('Cache-Control')).toBe(
            'public, max-age=60, s-maxage=300, stale-while-revalidate=60'
        );
        const body = await res.json();
        expect(body.domains).toHaveLength(2);
        expect(body.domains[0].id).toBe('dom-1');
    });

    it('returns 502 when a hierarchy call fails', async () => {
        const domains = [{ id: 'dom-1', name: 'Domain 1' }];

        const fetchMock = vi.fn(async (input: RequestInfo) => {
            const url = typeof input === 'string' ? input : input.url;
            if (url.endsWith('/domains')) return jsonResponse(domains);
            if (url.includes('/domains?id=dom-1')) return new Response('fail', { status: 500 });
            return new Response('not found', { status: 404 });
        });

        vi.stubGlobal('fetch', fetchMock);

        const res = await getQuizHierarchy();
        expect(res.status).toBe(502);
    });

    it('returns exam config from /api/bff/exam-config', async () => {
        const counts = { simple: 5, intermediate: 5, expert: 5, total: 15, isReady: true };

        const fetchMock = vi.fn(async (input: RequestInfo) => {
            const url = typeof input === 'string' ? input : input.url;
            if (url.endsWith('/quiz/count')) return jsonResponse(counts);
            return new Response('not found', { status: 404 });
        });

        vi.stubGlobal('fetch', fetchMock);

        const req = new NextRequest('http://localhost/api/bff/exam-config?domainId=dom-1');
        const res = await getExamConfig(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.questionCount.total).toBe(15);
        expect(body.minQuestions).toBe(5);
        expect(body.maxQuestions).toBe(30);
    });
});
