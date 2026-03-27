import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendPaymentOverdueReminder: vi.fn().mockResolvedValue({ delivered: 1 }),
  createQStashHandler: vi.fn(),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    PAYMENT_OVERDUE: 'payment.overdue',
  },
  createQStashHandler: (_type: string, handler: (envelope: { data: unknown }) => Promise<Response | void> | Response | void) => {
    mocks.createQStashHandler(_type, handler);
    return async () => {
      await handler({
        data: {
          userId: '33333333-3333-3333-3333-333333333333',
          installmentId: '44444444-4444-4444-4444-444444444444',
          overdueByDays: 12,
          detectedAt: '2026-04-10T09:30:00.000Z',
        },
      } as never);
      return new Response('OK', { status: 200 });
    };
  },
}));

vi.mock('@/modules/notifications/skillup-notifications.service', () => ({
  SkillupNotificationsService: {
    sendPaymentOverdueReminder: mocks.sendPaymentOverdueReminder,
  },
}));

import { POST } from '../route';

describe('POST /api/workers/payment-overdue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the qstash payload to the overdue reminder service', async () => {
    const response = await POST(new Request('http://localhost/api/workers/payment-overdue', { method: 'POST' }));

    expect(response.status).toBe(200);
    expect(mocks.sendPaymentOverdueReminder).toHaveBeenCalledWith({
      userId: '33333333-3333-3333-3333-333333333333',
      installmentId: '44444444-4444-4444-4444-444444444444',
      overdueByDays: 12,
      detectedAt: '2026-04-10T09:30:00.000Z',
    });
  });
});
