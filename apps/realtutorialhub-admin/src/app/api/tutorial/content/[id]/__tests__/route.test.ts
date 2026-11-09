import { describe, expect, it } from 'vitest';

import { GET, PATCH } from '../route';

describe('/api/tutorial/content/[id] (Retired Endpoint)', () => {
  it('GET returns 410 Gone with retirement notice', async () => {
    const response = await GET();
    expect(response.status).toBe(410);

    const body = (await response.json()) as { error: string; message: string; statusCode: number };
    expect(body.error).toBe('Gone');
    expect(body.statusCode).toBe(410);
    expect(body.message).toContain('permanently retired');
  });

  it('PATCH returns 410 Gone with retirement notice', async () => {
    const response = await PATCH();
    expect(response.status).toBe(410);

    const body = (await response.json()) as { error: string; message: string; statusCode: number };
    expect(body.error).toBe('Gone');
    expect(body.statusCode).toBe(410);
    expect(body.message).toContain('permanently retired');
  });
});
