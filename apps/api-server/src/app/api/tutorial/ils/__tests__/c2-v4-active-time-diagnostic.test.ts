/**
 * A4-C2-V4 DIAGNOSTIC TEST — ISOLATION ONLY
 * 
 * Purpose: Capture exact 400 response after successful authentication
 * 
 * RULES:
 * - NO mocking of validateRequest()
 * - NO mocking initially (use REAL everything)
 * - ONE test only
 * - Force diagnostic output through deliberate assertion failure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('C2-V4 Active-Time Diagnostic (NO MOCKS)', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.INTERNAL_API_SECRET;
    process.env.INTERNAL_API_SECRET = 'test-internal-secret-c2v2';
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.INTERNAL_API_SECRET = originalSecret;
    } else {
      delete process.env.INTERNAL_API_SECRET;
    }
  });

  it('DIAGNOSTIC: Capture exact response after successful auth', async () => {
    // Use REAL authentication middleware (not mocked)
    // Use REAL route (not mocked)
    // Use REAL service/repositories (not mocked initially)

    const request = new NextRequest('http://localhost/api/tutorial/ils/active-time', {
      method: 'POST',
      headers: {
        'X-Internal-Secret': 'test-internal-secret-c2v2',
        'X-User-ID': 'authenticated-user',
        'X-Brand': 'realtutorialhub',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
        incrementSeconds: 30,
      }),
    });

    const { POST } = await import('../active-time/route');
    const response = await POST(request);

    // Capture response safely
    const text = await response.text();
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    const diagnostic = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyText: text,
      bodyParsed: parsed,
    };

    // DELIBERATELY FAIL to force Vitest to print diagnostic info
    expect(diagnostic).toEqual({
      status: 200,
      statusText: 'OK',
      headers: expect.any(Object),
      bodyText: expect.any(String),
      bodyParsed: expect.objectContaining({ data: expect.any(Object) }),
    });
  });
});
