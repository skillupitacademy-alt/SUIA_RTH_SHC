import { describe, expect, it } from 'vitest';

import { POST } from '../route';

describe('POST /api/tutorial/content/[id]/publish (Retired Endpoint)', () => {
  it('returns 410 Gone with retirement notice', async () => {
    const response = await POST();
    expect(response.status).toBe(410);

    const body = (await response.json()) as { error: string; message: string; statusCode: number };
    expect(body.error).toBe('Gone');
    expect(body.statusCode).toBe(410);
    expect(body.message).toContain('permanently retired');
  });
});
