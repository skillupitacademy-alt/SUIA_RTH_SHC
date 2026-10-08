import { createQStashHandler, PlatformEventTypes } from '@quiz/events';

import { SkillupNotificationsService } from '@/modules/notifications/skillup-notifications.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = createQStashHandler(PlatformEventTypes.PAYMENT_OVERDUE, async (envelope) => {
  const payload = envelope.data as {
    userId: string;
    installmentId: string;
    overdueByDays: number;
    detectedAt: string;
  };

  await SkillupNotificationsService.sendPaymentOverdueReminder({
    userId: payload.userId,
    installmentId: payload.installmentId,
    overdueByDays: payload.overdueByDays,
    detectedAt: payload.detectedAt,
  });
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
