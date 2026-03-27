import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

const eventMocks = vi.hoisted(() => ({
  createQStashHandler: vi.fn(),
}));

vi.mock('@quiz/events', () => ({
  PlatformEventTypes: {
    USER_REGISTERED: 'user.registered',
    PAYMENT_RECEIVED: 'payment.received',
  },
  createQStashHandler: (type: string, handler: (envelope: { data: unknown }) => Promise<Response | void> | Response | void) => {
    eventMocks.createQStashHandler(type, handler);
    return async (request: Request) => {
      const body = JSON.parse(await request.text()) as { data: unknown };
      const response = await handler(body);
      return response instanceof Response ? response : new Response('OK', { status: 200 });
    };
  },
}));

const publishMocks = vi.hoisted(() => ({
  publishSubscriptionUpgraded: vi.fn(async () => ({ messageId: 'msg-subscription-upgraded', envelope: {} })),
}));

vi.mock('@/lib/skillhubcore-events', () => publishMocks);

import { createSkillhubcoreEventRoutes } from '../skillhubcore-events.routes';

class FakeSubscriptionService {
  getFeatures = vi.fn(async () => ['tutorial.preview_only']);
  getActivePlan = vi.fn(async () => ({
    planType: 'pro' as const,
    features: ['ai_tutor', 'live_sessions'],
    status: 'active' as const,
    startedAt: new Date(),
    expiresAt: null,
    cachedAt: null,
  }));
  getPlanFeatures = vi.fn(async () => ['tutorial.preview_only']);
  onPaymentReceived = vi.fn(async () => undefined);
}

const makeRequest = (path: string, data: unknown) => new Request(`http://localhost${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ data }),
});

describe('skillhubcore event routes', () => {
  it('seeds default features for user registrations', async () => {
    const subscriptionService = new FakeSubscriptionService();
    const app = new Hono().route('/consumers', createSkillhubcoreEventRoutes({ subscriptionService: subscriptionService as never }));

    const response = await app.fetch(makeRequest('/consumers/user-registered', {
      userId: crypto.randomUUID(),
      email: 'student@example.com',
      platform: 'realtutorialhub',
      role: 'student',
      registeredAt: new Date().toISOString(),
    }));

    expect(response.status).toBe(200);
    expect(subscriptionService.getFeatures).toHaveBeenCalled();
  });

  it('updates subscriptions and publishes an upgraded event after payment receipt', async () => {
    const subscriptionService = new FakeSubscriptionService();
    const app = new Hono().route('/consumers', createSkillhubcoreEventRoutes({ subscriptionService: subscriptionService as never }));

    const response = await app.fetch(makeRequest('/consumers/payment-received', {
      userId: crypto.randomUUID(),
      installmentId: crypto.randomUUID(),
      amount: 18000,
      paidAt: new Date().toISOString(),
    }));

    expect(response.status).toBe(200);
    expect(subscriptionService.onPaymentReceived).toHaveBeenCalledWith(expect.objectContaining({
      planType: 'pro',
      features: ['ai_tutor', 'live_sessions'],
    }));
    expect(publishMocks.publishSubscriptionUpgraded).toHaveBeenCalledWith(expect.objectContaining({
      planType: 'pro',
      features: ['ai_tutor', 'live_sessions'],
    }));
  });
});
