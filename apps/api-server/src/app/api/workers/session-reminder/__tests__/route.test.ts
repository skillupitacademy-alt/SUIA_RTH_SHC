import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendSessionReminder: vi.fn().mockResolvedValue({ delivered: 2, batchName: 'Batch A' }),
  createQStashHandler: vi.fn(),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    SESSION_SCHEDULED: 'session.scheduled',
  },
  createQStashHandler: (_type: string, handler: (envelope: { data: unknown }) => Promise<Response | void> | Response | void) => {
    mocks.createQStashHandler(_type, handler);
    return async () => {
      await handler({
        data: {
          batchId: '11111111-1111-1111-1111-111111111111',
          sessionId: '22222222-2222-2222-2222-222222222222',
          scheduledAt: '2026-04-10T09:30:00.000Z',
          sessionNotes: 'React hooks',
        },
      } as never);
      return new Response('OK', { status: 200 });
    };
  },
}));

vi.mock('@/modules/notifications/skillup-notifications.service', () => ({
  SkillupNotificationsService: {
    sendSessionReminder: mocks.sendSessionReminder,
  },
}));

import { POST } from '../route';

describe('POST /api/workers/session-reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the qstash payload to the notification service', async () => {
    const response = await POST(new Request('http://localhost/api/workers/session-reminder', { method: 'POST' }));

    expect(response.status).toBe(200);
    expect(mocks.sendSessionReminder).toHaveBeenCalledWith({
      batchId: '11111111-1111-1111-1111-111111111111',
      sessionId: '22222222-2222-2222-2222-222222222222',
      scheduledAt: '2026-04-10T09:30:00.000Z',
      sessionNotes: 'React hooks',
    });
  });
});
