/**
 * Diagnostic test to understand why positive auth tests return 400
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('C2-V3 Diagnostic', () => {
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

  it('should diagnose active-time 400 response', async () => {
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

    console.log('Response status:', response.status);
    const body = await response.json();
    console.log('Response body:', JSON.stringify(body, null, 2));

    // Just diagnostic - no assertion
  });
});
