import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withEtags } from '../etag.middleware';

describe('Middleware: ETags (Task 103)', () => {
    it('should add an ETag header to a successful JSON GET response', async () => {
        const req = new NextRequest('https://api.example.com/api/test');
        const res = NextResponse.json({ foo: 'bar' });
        
        const finalRes = await withEtags(req, res);
        
        expect(finalRes.headers.get('ETag')).toMatch(/^W\/"[a-f0-9]+"$/);
    });

    it('should return 304 if If-None-Match matches the computed ETag', async () => {
        const data = { foo: 'bar' };
        const req1 = new NextRequest('https://api.example.com/api/test');
        const res1 = NextResponse.json(data);
        const processedRes1 = await withEtags(req1, res1);
        const etag = processedRes1.headers.get('ETag')!;

        const req2 = new NextRequest('https://api.example.com/api/test', {
            headers: { 'If-None-Match': etag }
        });
        const res2 = NextResponse.json(data);
        
        const finalRes = await withEtags(req2, res2);
        
        expect(finalRes.status).toBe(304);
        expect(finalRes.headers.get('ETag')).toBe(etag);
    });

    it('should not add ETag for non-GET requests', async () => {
        const req = new NextRequest('https://api.example.com/api/test', { method: 'POST' });
        const res = NextResponse.json({ foo: 'bar' });
        
        const finalRes = await withEtags(req, res);
        
        expect(finalRes.headers.get('ETag')).toBeNull();
    });
});
