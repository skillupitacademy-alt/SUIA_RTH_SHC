import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from '../csrf.middleware';

vi.mock('@/config', () => ({
  config: {
    csrf: {
      allowedOrigins: ['http://trusted.com'],
      cookieSettings: { httpOnly: true },
    },
  },
}));

describe('csrfProtection', () => {
  const originalEnv = process.env.INTERNAL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_KEY = 'internal-key';
  });

  afterEach(() => {
    process.env.INTERNAL_API_KEY = originalEnv;
  });

  it('returns null for safe methods (GET, HEAD, OPTIONS)', async () => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    for (const method of safeMethods) {
      const req = new NextRequest('http://localhost', { method });
      const res = await csrfProtection(req);
      expect(res).toBeNull();
    }
  });

  it('blocks unsafe methods without CSRF token', async () => {
    const req = new NextRequest('http://localhost', { method: 'POST' });
    const res = await csrfProtection(req);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res!.status).toBe(403);
  });

  it('allows POST with valid CSRF token', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      headers: { 'x-csrf-token': 'valid' },
    });
    req.cookies.set('csrfToken', 'valid');
    
    const res = await csrfProtection(req);
    expect(res).toBeNull();
  });

  it('allows POST with valid internal key', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      headers: { 'x-internal-key': 'internal-key' },
    });
    const res = await csrfProtection(req);
    expect(res).toBeNull();
  });

  it('blocks POST with mismatched origin', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      headers: { 'origin': 'http://evil.com', 'host': 'localhost' },
    });
    const res = await csrfProtection(req);
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body.message).toBe('Origin mismatch');
  });

  it('exempts security report and telemetry routes', async () => {
    const exemptPaths = ['/api/security/report', '/api/logs/client', '/api/workflows/foo', '/api/export/trigger'];
    for (const path of exemptPaths) {
      const req = new NextRequest(`http://localhost${path}`, { method: 'POST' });
      const res = await csrfProtection(req);
      expect(res).toBeNull();
    }
  });

  it('self-heals if session exists but CSRF is missing', async () => {
    const req = new NextRequest('http://localhost', { method: 'POST' });
    req.cookies.set('accessToken', 'valid');
    
    const res = await csrfProtection(req);
    expect(res!.status).toBe(403);
    expect(res!.cookies.get('csrfToken')).toBeDefined();
  });
});
