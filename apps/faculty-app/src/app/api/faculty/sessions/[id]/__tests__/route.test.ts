import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  relayMock: vi.fn(),
}));

vi.mock('@/lib/faculty-api', () => ({
  relayFacultyUpstreamResponse: mocks.relayMock,
}));

import { PATCH } from '../route';

const makeRequest = (url: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: 'PATCH',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('PATCH /api/faculty/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.relayMock.mockResolvedValue(
      jsonResponse({ data: { id: 'session-1', status: 'completed' } })
    );
  });

  it('returns 400 for invalid session ids', async () => {
    const response = await PATCH(makeRequest('/api/faculty/sessions/'), {
      params: Promise.resolve({ id: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('relays the patch to api-server', async () => {
    const response = await PATCH(
      makeRequest('/api/faculty/sessions/session-1', {
        scheduledAt: '2026-03-22T12:00:00.000Z',
        durationMinutes: 90,
        sessionNotes: 'Updated notes',
        status: 'completed',
      }),
      {
        params: Promise.resolve({ id: 'session-1' }),
      }
    );

    expect(response.status).toBe(200);
    expect(mocks.relayMock).toHaveBeenCalledTimes(1);
  });
});
