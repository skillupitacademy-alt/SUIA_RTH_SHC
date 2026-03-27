import { Hono } from 'hono';

import { createQStashHandler, PlatformEventTypes, type EventEnvelope } from '@quiz/events';

import { publishSubscriptionUpgraded } from '@/lib/skillhubcore-events';
import { SubscriptionService } from '@/modules/subscription/subscription.service';

type SkillhubcoreEventRoutesDependencies = {
  subscriptionService?: SubscriptionService;
};

export const createSkillhubcoreEventRoutes = (dependencies: SkillhubcoreEventRoutesDependencies = {}): Hono => {
  const app = new Hono();
  const subscriptionService = dependencies.subscriptionService ?? new SubscriptionService();

  const userRegisteredHandler = createQStashHandler(PlatformEventTypes.USER_REGISTERED, async (envelope: EventEnvelope<typeof PlatformEventTypes.USER_REGISTERED, unknown>) => {
    const payload = envelope.data as {
      userId: string;
      email: string;
      platform: 'realtutorialhub' | 'skillup';
      role: 'student' | 'faculty' | 'admin';
      registeredAt: string;
    };

    await subscriptionService.getFeatures(payload.userId);
  });

  const paymentReceivedHandler = createQStashHandler(PlatformEventTypes.PAYMENT_RECEIVED, async (envelope: EventEnvelope<typeof PlatformEventTypes.PAYMENT_RECEIVED, unknown>) => {
    const payload = envelope.data as {
      userId: string;
      installmentId: string;
      amount: number;
      paidAt: string;
    };

    const activePlan = await subscriptionService.getActivePlan(payload.userId);
    const planType = activePlan?.planType ?? 'free';
    const features = activePlan !== null && Array.isArray(activePlan.features) && activePlan.features.length > 0
      ? activePlan.features
      : await subscriptionService.getPlanFeatures(planType);

    await subscriptionService.onPaymentReceived({
      userId: payload.userId,
      planType,
      features,
    });

    await publishSubscriptionUpgraded({
      userId: payload.userId,
      planType,
      features,
      upgradedAt: payload.paidAt,
    });
  });

  app.post('/user-registered', async (c) => userRegisteredHandler(c.req.raw));
  app.post('/payment-received', async (c) => paymentReceivedHandler(c.req.raw));

  return app;
};
