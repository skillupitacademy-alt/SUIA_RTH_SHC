import { describe, expect, it } from 'vitest';

import { GET } from '../route';

describe('GET /api/tutorial/content/audit (Retired Endpoint)', () => {
  it('returns 410 Gone with retirement notice', async () => {
    const response = await GET();
    expect(response.status).toBe(410);

    const body = (await response.json()) as { error: string; message: string; statusCode: number };
    expect(body.error).toBe('Gone');
    expect(body.statusCode).toBe(410);
    expect(body.message).toContain('permanently retired');
  });
});
