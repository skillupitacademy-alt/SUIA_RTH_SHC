import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '../route';

const mocks = vi.hoisted(() => ({
  relayMock: vi.fn(),
}));

vi.mock('@/lib/faculty-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/faculty-api')>('@/lib/faculty-api');
  return {
    ...actual,
    relayFacultyUpstreamResponse: mocks.relayMock,
  };
});

describe('PATCH /api/faculty/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid session ids', async () => {
    const response = await PATCH(
      new NextRequest('http://localhost/api/faculty/sessions/', {
        method: 'PATCH',
        body: JSON.stringify({ sessionNotes: 'Updated notes' }),
      }),
      {
        params: Promise.resolve({ id: '' }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('relays the patch to api-server', async () => {
    mocks.relayMock.mockResolvedValueOnce(NextResponse.json({ data: { id: 'session-1', status: 'completed' } }));

    const response = await PATCH(
      new NextRequest('http://localhost/api/faculty/sessions/session-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: '2026-03-22T12:00:00.000Z',
          durationMinutes: 90,
          sessionNotes: 'Updated notes',
          status: 'completed',
        }),
      }),
      {
        params: Promise.resolve({ id: 'session-1' }),
      }
    );

    expect(response.status).toBe(200);
    expect(mocks.relayMock).toHaveBeenCalledTimes(1);
  });
});
