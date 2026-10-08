import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '../rate-limit.middleware';
import { cacheService } from '@/modules/core/cache.service';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('Middleware: Rate Limiting (Task 104)', () => {
    it('should allow requests within the limit', async () => {
        const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
        const limitedHandler = withRateLimit(handler, { limit: 2, windowMs: 1000 });
        vi.spyOn(cacheService, 'increment')
          .mockResolvedValueOnce({ count: 1, ttlRem: 1 })
          .mockResolvedValueOnce({ count: 2, ttlRem: 1 });
        
        const req = new NextRequest('https://api.example.com/api/test', {
            headers: { 'x-real-ip': '1.2.3.4' }
        });

        const res1 = await limitedHandler(req, {});
        expect(res1.status).toBe(200);
        expect(res1.headers.get('x-ratelimit-remaining')).toBe('1');

        const res2 = await limitedHandler(req, {});
        expect(res2.status).toBe(200);
        expect(res2.headers.get('x-ratelimit-remaining')).toBe('0');
    });

    it('should block requests exceeding the limit', async () => {
        const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
        const limitedHandler = withRateLimit(handler, { limit: 1, windowMs: 1000 });
        vi.spyOn(cacheService, 'increment')
          .mockResolvedValueOnce({ count: 1, ttlRem: 1 })
          .mockResolvedValueOnce({ count: 2, ttlRem: 1 });
        
        const req = new NextRequest('https://api.example.com/api/test', {
            headers: { 'x-real-ip': '5.6.7.8' }
        });

        await limitedHandler(req, {}); // Request 1 (Success)
        const res2 = await limitedHandler(req, {}); // Request 2 (Fail)
        
        expect(res2.status).toBe(429);
        const body = await res2.json();
        expect(body.error).toBe('Too Many Requests');
        expect(res2.headers.get('retry-after')).toBeDefined();
    });
});
