import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from '../route';

describe('GET /api/tutorial/content/[subtopicId] (Retired Endpoint)', () => {
  it('returns 410 Gone with retirement notice', async () => {
    const subtopicId = '11111111-1111-1111-1111-111111111111';
    const response = await GET(
      new NextRequest(`http://localhost/api/tutorial/content/${subtopicId}`),
      { params: Promise.resolve({ subtopicId }) },
    );

    expect(response.status).toBe(410);
    const body = (await response.json()) as { error: string; message: string; statusCode: number };
    expect(body.error).toBe('Gone');
    expect(body.statusCode).toBe(410);
    expect(body.message).toContain('permanently retired');
  });
});
