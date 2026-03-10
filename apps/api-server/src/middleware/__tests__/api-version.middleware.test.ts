import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { applyApiVersion, DEFAULT_VERSION } from '../api-version.middleware';

describe('Middleware: API Versioning (Task 100)', () => {
    it('should apply the default version header when no version is provided', () => {
        const req = new NextRequest('https://api.example.com/api/test');
        const res = NextResponse.next();
        
        applyApiVersion(req, res);
        
        expect(res.headers.get('X-API-Version')).toBe(DEFAULT_VERSION);
    });

    it('should extract version from the URL path', () => {
        const req = new NextRequest('https://api.example.com/api/v1/test');
        const res = NextResponse.next();
        
        applyApiVersion(req, res);
        
        expect(res.headers.get('X-API-Version')).toBe('v1');
    });

    it('should extract version from the Accept-Version header', () => {
        const req = new NextRequest('https://api.example.com/api/test', {
            headers: { 'Accept-Version': 'v1' }
        });
        const res = NextResponse.next();
        
        applyApiVersion(req, res);
        
        expect(res.headers.get('X-API-Version')).toBe('v1');
    });

    it('should prefer URL path version over Accept-Version header', () => {
        const req = new NextRequest('https://api.example.com/api/v1/test', {
            headers: { 'Accept-Version': 'v2' } // v2 not in supported list but showing preference logic
        });
        const res = NextResponse.next();
        
        applyApiVersion(req, res);
        
        expect(res.headers.get('X-API-Version')).toBe('v1');
    });
});
