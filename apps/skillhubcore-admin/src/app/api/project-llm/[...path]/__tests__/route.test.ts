import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminRequest: vi.fn(),
}));

vi.mock('@/lib/admin-route-guard', () => ({
  requireAdminRequest: mocks.requireAdminRequest,
}));

import { GET, POST } from '../route';

describe('Project AI Worker: Error Sanitization & Trusted-Admin Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mocks.requireAdminRequest.mockResolvedValue(null); // Access granted
  });

  it('sanitizes upstream 500 server error into 502 PROJECT_AI_BACKEND_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 500,
      text: vi.fn().mockResolvedValue(JSON.stringify({
        detail: 'Internal server error: Traceback in /var/internal/worker.py at line 142',
      })),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/project-llm/workflows/status', {
      headers: {
        cookie: 'accessToken=admin-jwt-token',
        'x-request-id': 'req-safe-123',
      },
    });

    const context = {
      params: Promise.resolve({ path: ['workflows', 'status'] }),
    };

    const res = await GET(req, context);
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('private, no-store');

    const json = await res.json();
    expect(json.error).toBe('PROJECT_AI_BACKEND_ERROR');
    expect(json.requestId).toBe('req-safe-123');
    // Ensure internal traceback detail is never leaked to client
    expect(json.detail).toBeUndefined();
  });

  it('sanitizes backend connection failure into 502 PROJECT_AI_BACKEND_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED 127.0.0.1:8000'));

    const req = new NextRequest('http://localhost/api/project-llm/workflows/execute', {
      method: 'POST',
      headers: {
        cookie: 'accessToken=admin-jwt-token',
        'x-request-id': 'req-conn-err',
      },
    });

    const context = {
      params: Promise.resolve({ path: ['workflows', 'execute'] }),
    };

    const res = await POST(req, context);
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('private, no-store');

    const json = await res.json();
    expect(json.error).toBe('PROJECT_AI_BACKEND_ERROR');
    expect(json.requestId).toBe('req-conn-err');
  });

  it('relays successful 200 response with private, no-store cache headers', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ status: 'completed', score: 95 })),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/project-llm/workflows/status', {
      headers: {
        cookie: 'accessToken=admin-jwt-token',
      },
    });

    const context = {
      params: Promise.resolve({ path: ['workflows', 'status'] }),
    };

    const res = await GET(req, context);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');

    const json = await res.json();
    expect(json.status).toBe('completed');
    expect(json.score).toBe(95);
  });
});
